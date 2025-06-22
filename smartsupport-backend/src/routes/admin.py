from flask import Blueprint, request, jsonify, session
from src.models.user import db, User, TicketStatus, Category, SLAPolicy
from src.routes.auth import login_required, role_required

admin_bp = Blueprint('admin', __name__)

# User Management
@admin_bp.route('/users', methods=['GET'])
@role_required(['Admin'])
def get_users():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    
    users = User.query.paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'users': [user.to_dict() for user in users.items],
        'total': users.total,
        'pages': users.pages,
        'current_page': page,
        'per_page': per_page
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@role_required(['Admin'])
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json()
    
    if 'name' in data:
        user.name = data['name']
    if 'email' in data:
        # Check if email is already taken
        existing_user = User.query.filter_by(email=data['email']).first()
        if existing_user and existing_user.id != user_id:
            return jsonify({'error': 'Email already in use'}), 400
        user.email = data['email']
    if 'role' in data:
        user.role = data['role']
    
    db.session.commit()
    
    return jsonify({
        'message': 'User updated successfully',
        'user': user.to_dict()
    }), 200

@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@role_required(['Admin'])
def delete_user(user_id):
    user = User.query.get_or_404(user_id)
    
    # Don't allow deleting the current admin
    if user_id == session['user_id']:
        return jsonify({'error': 'Cannot delete your own account'}), 400
    
    db.session.delete(user)
    db.session.commit()
    
    return jsonify({'message': 'User deleted successfully'}), 200

# Ticket Status Management
@admin_bp.route('/ticket-statuses', methods=['GET'])
@login_required
def get_ticket_statuses():
    statuses = TicketStatus.query.order_by(TicketStatus.order).all()
    return jsonify({
        'statuses': [status.to_dict() for status in statuses]
    }), 200

@admin_bp.route('/ticket-statuses', methods=['POST'])
@role_required(['Admin'])
def create_ticket_status():
    data = request.get_json()
    name = data.get('name')
    order = data.get('order', 0)
    is_terminal = data.get('is_terminal', False)
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    status = TicketStatus(
        name=name,
        order=order,
        is_terminal=is_terminal
    )
    
    db.session.add(status)
    db.session.commit()
    
    return jsonify({
        'message': 'Ticket status created successfully',
        'status': status.to_dict()
    }), 201

@admin_bp.route('/ticket-statuses/<int:status_id>', methods=['PUT'])
@role_required(['Admin'])
def update_ticket_status(status_id):
    status = TicketStatus.query.get_or_404(status_id)
    data = request.get_json()
    
    if 'name' in data:
        status.name = data['name']
    if 'order' in data:
        status.order = data['order']
    if 'is_terminal' in data:
        status.is_terminal = data['is_terminal']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Ticket status updated successfully',
        'status': status.to_dict()
    }), 200

@admin_bp.route('/ticket-statuses/<int:status_id>', methods=['DELETE'])
@role_required(['Admin'])
def delete_ticket_status(status_id):
    status = TicketStatus.query.get_or_404(status_id)
    
    # Check if any tickets are using this status
    if status.tickets.count() > 0:
        return jsonify({'error': 'Cannot delete status that is in use by tickets'}), 400
    
    db.session.delete(status)
    db.session.commit()
    
    return jsonify({'message': 'Ticket status deleted successfully'}), 200

# Category Management
@admin_bp.route('/categories', methods=['GET'])
@login_required
def get_categories():
    categories = Category.query.all()
    return jsonify({
        'categories': [category.to_dict() for category in categories]
    }), 200

@admin_bp.route('/categories', methods=['POST'])
@role_required(['Admin'])
def create_category():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description', '')
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    category = Category(
        name=name,
        description=description
    )
    
    db.session.add(category)
    db.session.commit()
    
    return jsonify({
        'message': 'Category created successfully',
        'category': category.to_dict()
    }), 201

@admin_bp.route('/categories/<int:category_id>', methods=['PUT'])
@role_required(['Admin'])
def update_category(category_id):
    category = Category.query.get_or_404(category_id)
    data = request.get_json()
    
    if 'name' in data:
        category.name = data['name']
    if 'description' in data:
        category.description = data['description']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Category updated successfully',
        'category': category.to_dict()
    }), 200

@admin_bp.route('/categories/<int:category_id>', methods=['DELETE'])
@role_required(['Admin'])
def delete_category(category_id):
    category = Category.query.get_or_404(category_id)
    
    # Check if any tickets are using this category
    if category.tickets.count() > 0:
        return jsonify({'error': 'Cannot delete category that is in use by tickets'}), 400
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Category deleted successfully'}), 200

# SLA Policy Management
@admin_bp.route('/sla-policies', methods=['GET'])
@role_required(['Admin', 'Agent', 'L1', 'L2', 'L3'])
def get_sla_policies():
    policies = SLAPolicy.query.filter_by(active=True).all()
    return jsonify({
        'policies': [policy.to_dict() for policy in policies]
    }), 200

@admin_bp.route('/sla-policies', methods=['POST'])
@role_required(['Admin'])
def create_sla_policy():
    data = request.get_json()
    name = data.get('name')
    response_time_minutes = data.get('response_time_minutes')
    resolution_time_minutes = data.get('resolution_time_minutes')
    escalation_policy = data.get('escalation_policy', {})
    
    if not name:
        return jsonify({'error': 'Name is required'}), 400
    
    policy = SLAPolicy(
        name=name,
        response_time_minutes=response_time_minutes,
        resolution_time_minutes=resolution_time_minutes
    )
    policy.set_escalation_policy(escalation_policy)
    
    db.session.add(policy)
    db.session.commit()
    
    return jsonify({
        'message': 'SLA policy created successfully',
        'policy': policy.to_dict()
    }), 201

@admin_bp.route('/sla-policies/<int:policy_id>', methods=['PUT'])
@role_required(['Admin'])
def update_sla_policy(policy_id):
    policy = SLAPolicy.query.get_or_404(policy_id)
    data = request.get_json()
    
    if 'name' in data:
        policy.name = data['name']
    if 'response_time_minutes' in data:
        policy.response_time_minutes = data['response_time_minutes']
    if 'resolution_time_minutes' in data:
        policy.resolution_time_minutes = data['resolution_time_minutes']
    if 'escalation_policy' in data:
        policy.set_escalation_policy(data['escalation_policy'])
    if 'active' in data:
        policy.active = data['active']
    
    db.session.commit()
    
    return jsonify({
        'message': 'SLA policy updated successfully',
        'policy': policy.to_dict()
    }), 200

