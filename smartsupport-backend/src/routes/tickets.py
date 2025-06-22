from flask import Blueprint, request, jsonify, session
from src.models.user import db, Ticket, User, TicketStatus, Category, SLAPolicy, Comment, Log
from src.routes.auth import login_required, role_required
from datetime import datetime

tickets_bp = Blueprint('tickets', __name__)

@tickets_bp.route('/tickets', methods=['GET'])
@login_required
def get_tickets():
    user = User.query.get(session['user_id'])
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    status_filter = request.args.get('status')
    priority_filter = request.args.get('priority')
    category_filter = request.args.get('category')
    
    query = Ticket.query
    
    # Role-based filtering
    if user.role == 'End-User':
        query = query.filter_by(created_by=user.id)
    elif user.role in ['Agent', 'L1', 'L2', 'L3']:
        # Agents see tickets assigned to them or unassigned tickets
        query = query.filter(
            (Ticket.assigned_to == user.id) | 
            (Ticket.assigned_to.is_(None))
        )
    # Admins see all tickets
    
    # Apply filters
    if status_filter:
        query = query.filter_by(status=status_filter)
    if priority_filter:
        query = query.filter_by(priority=priority_filter)
    if category_filter:
        query = query.filter_by(category_id=category_filter)
    
    # Order by creation date (newest first)
    query = query.order_by(Ticket.created_at.desc())
    
    tickets = query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'tickets': [ticket.to_dict() for ticket in tickets.items],
        'total': tickets.total,
        'pages': tickets.pages,
        'current_page': page,
        'per_page': per_page
    }), 200

@tickets_bp.route('/tickets', methods=['POST'])
@login_required
def create_ticket():
    data = request.get_json()
    subject = data.get('subject')
    description = data.get('description')
    priority = data.get('priority', 'Medium')
    category_id = data.get('category_id')
    
    if not subject:
        return jsonify({'error': 'Subject is required'}), 400
    
    # Get default status (Open)
    default_status = TicketStatus.query.filter_by(name='Open').first()
    if not default_status:
        return jsonify({'error': 'Default status not found'}), 500
    
    ticket = Ticket(
        subject=subject,
        description=description,
        priority=priority,
        category_id=category_id,
        status=default_status.id,
        created_by=session['user_id']
    )
    
    db.session.add(ticket)
    db.session.commit()
    
    # Create log entry
    log = Log(
        ticket_id=ticket.id,
        action=f'Ticket created with priority {priority}',
        actor_id=session['user_id']
    )
    db.session.add(log)
    db.session.commit()
    
    return jsonify({
        'message': 'Ticket created successfully',
        'ticket': ticket.to_dict()
    }), 201

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['GET'])
@login_required
def get_ticket(ticket_id):
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    
    # Check permissions
    if user.role == 'End-User' and ticket.created_by != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # Get comments
    comments = Comment.query.filter_by(ticket_id=ticket_id).order_by(Comment.created_at.asc()).all()
    
    # Filter internal comments for end users
    if user.role == 'End-User':
        comments = [c for c in comments if not c.is_internal]
    
    ticket_data = ticket.to_dict()
    ticket_data['comments'] = [comment.to_dict() for comment in comments]
    
    return jsonify({'ticket': ticket_data}), 200

@tickets_bp.route('/tickets/<int:ticket_id>', methods=['PUT'])
@login_required
def update_ticket(ticket_id):
    user = User.query.get(session['user_id'])
    ticket = Ticket.query.get_or_404(ticket_id)
    data = request.get_json()
    
    # Check permissions
    if user.role == 'End-User' and ticket.created_by != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    changes = []
    
    # Update fields
    if 'subject' in data and user.role != 'End-User':
        old_subject = ticket.subject
        ticket.subject = data['subject']
        changes.append(f'Subject changed from "{old_subject}" to "{ticket.subject}"')
    
    if 'description' in data:
        ticket.description = data['description']
        changes.append('Description updated')
    
    if 'priority' in data and user.role in ['Admin', 'Agent', 'L1', 'L2', 'L3']:
        old_priority = ticket.priority
        ticket.priority = data['priority']
        changes.append(f'Priority changed from {old_priority} to {ticket.priority}')
    
    if 'status' in data and user.role in ['Admin', 'Agent', 'L1', 'L2', 'L3']:
        old_status = ticket.status_obj.name if ticket.status_obj else 'None'
        ticket.status = data['status']
        new_status = TicketStatus.query.get(data['status'])
        changes.append(f'Status changed from {old_status} to {new_status.name if new_status else "Unknown"}')
    
    if 'assigned_to' in data and user.role in ['Admin', 'Agent', 'L1', 'L2', 'L3']:
        old_assignee = ticket.assignee.name if ticket.assignee else 'Unassigned'
        ticket.assigned_to = data['assigned_to']
        new_assignee = User.query.get(data['assigned_to']) if data['assigned_to'] else None
        changes.append(f'Assigned from {old_assignee} to {new_assignee.name if new_assignee else "Unassigned"}')
    
    if 'category_id' in data and user.role in ['Admin', 'Agent', 'L1', 'L2', 'L3']:
        ticket.category_id = data['category_id']
        changes.append('Category updated')
    
    ticket.updated_at = datetime.utcnow()
    db.session.commit()
    
    # Create log entries for changes
    for change in changes:
        log = Log(
            ticket_id=ticket.id,
            action=change,
            actor_id=session['user_id']
        )
        db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ticket updated successfully',
        'ticket': ticket.to_dict()
    }), 200

@tickets_bp.route('/tickets/<int:ticket_id>/comments', methods=['POST'])
@login_required
def add_comment(ticket_id):
    ticket = Ticket.query.get_or_404(ticket_id)
    user = User.query.get(session['user_id'])
    data = request.get_json()
    
    comment_text = data.get('comment_text')
    is_internal = data.get('is_internal', False)
    
    if not comment_text:
        return jsonify({'error': 'Comment text is required'}), 400
    
    # Check permissions
    if user.role == 'End-User' and ticket.created_by != user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    # End users cannot create internal comments
    if user.role == 'End-User':
        is_internal = False
    
    comment = Comment(
        ticket_id=ticket_id,
        user_id=session['user_id'],
        comment_text=comment_text,
        is_internal=is_internal
    )
    
    db.session.add(comment)
    
    # Update ticket timestamp
    ticket.updated_at = datetime.utcnow()
    
    # Create log entry
    log = Log(
        ticket_id=ticket.id,
        action=f'Comment added {"(internal)" if is_internal else ""}',
        actor_id=session['user_id']
    )
    db.session.add(log)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Comment added successfully',
        'comment': comment.to_dict()
    }), 201

@tickets_bp.route('/tickets/stats', methods=['GET'])
@login_required
def get_ticket_stats():
    user = User.query.get(session['user_id'])
    
    base_query = Ticket.query
    
    # Role-based filtering
    if user.role == 'End-User':
        base_query = base_query.filter_by(created_by=user.id)
    elif user.role in ['Agent', 'L1', 'L2', 'L3']:
        base_query = base_query.filter(
            (Ticket.assigned_to == user.id) | 
            (Ticket.assigned_to.is_(None))
        )
    
    # Get status counts
    status_counts = {}
    statuses = TicketStatus.query.all()
    for status in statuses:
        count = base_query.filter_by(status=status.id).count()
        status_counts[status.name] = count
    
    # Get priority counts
    priority_counts = {}
    priorities = ['Low', 'Medium', 'High', 'Critical']
    for priority in priorities:
        count = base_query.filter_by(priority=priority).count()
        priority_counts[priority] = count
    
    total_tickets = base_query.count()
    
    return jsonify({
        'total_tickets': total_tickets,
        'status_counts': status_counts,
        'priority_counts': priority_counts
    }), 200

