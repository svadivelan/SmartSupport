from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
import json

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    email = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    role = db.Column(db.String(50), nullable=False)  # Admin, Agent, End-User, L1, L2, L3
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_tickets = db.relationship('Ticket', foreign_keys='Ticket.created_by', backref='creator', lazy='dynamic')
    assigned_tickets = db.relationship('Ticket', foreign_keys='Ticket.assigned_to', backref='assignee', lazy='dynamic')
    comments = db.relationship('Comment', backref='author', lazy='dynamic')
    notifications = db.relationship('Notification', backref='recipient', lazy='dynamic')

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'email': self.email,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class TicketStatus(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    order = db.Column(db.Integer)
    is_terminal = db.Column(db.Boolean, default=False)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='status_obj', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'order': self.order,
            'is_terminal': self.is_terminal
        }

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='category_obj', lazy='dynamic')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }

class SLAPolicy(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    response_time_minutes = db.Column(db.Integer)
    resolution_time_minutes = db.Column(db.Integer)
    escalation_policy = db.Column(db.Text)  # JSON string
    active = db.Column(db.Boolean, default=True)
    
    # Relationships
    tickets = db.relationship('Ticket', backref='sla_policy_obj', lazy='dynamic')

    def get_escalation_policy(self):
        if self.escalation_policy:
            return json.loads(self.escalation_policy)
        return {}

    def set_escalation_policy(self, policy_dict):
        self.escalation_policy = json.dumps(policy_dict)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'response_time_minutes': self.response_time_minutes,
            'resolution_time_minutes': self.resolution_time_minutes,
            'escalation_policy': self.get_escalation_policy(),
            'active': self.active
        }

class Ticket(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    subject = db.Column(db.Text, nullable=False)
    description = db.Column(db.Text)
    status = db.Column(db.Integer, db.ForeignKey('ticket_status.id'))
    priority = db.Column(db.String(50))  # Low, Medium, High, Critical
    created_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    assigned_to = db.Column(db.Integer, db.ForeignKey('user.id'))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'))
    sla_policy_id = db.Column(db.Integer, db.ForeignKey('sla_policy.id'))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    comments = db.relationship('Comment', backref='ticket', lazy='dynamic', cascade='all, delete-orphan')
    attachments = db.relationship('Attachment', backref='ticket', lazy='dynamic', cascade='all, delete-orphan')
    logs = db.relationship('Log', backref='ticket', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'subject': self.subject,
            'description': self.description,
            'status': self.status_obj.to_dict() if self.status_obj else None,
            'priority': self.priority,
            'created_by': self.creator.to_dict() if self.creator else None,
            'assigned_to': self.assignee.to_dict() if self.assignee else None,
            'category': self.category_obj.to_dict() if self.category_obj else None,
            'sla_policy': self.sla_policy_obj.to_dict() if self.sla_policy_obj else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'comments_count': self.comments.count(),
            'attachments_count': self.attachments.count()
        }

class Comment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    comment_text = db.Column(db.Text, nullable=False)
    is_internal = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'user': self.author.to_dict() if self.author else None,
            'comment_text': self.comment_text,
            'is_internal': self.is_internal,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class Attachment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    file_name = db.Column(db.Text)
    file_url = db.Column(db.Text)
    uploaded_by = db.Column(db.Integer, db.ForeignKey('user.id'))
    uploaded_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    uploader = db.relationship('User', backref='uploaded_attachments')

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'file_name': self.file_name,
            'file_url': self.file_url,
            'uploaded_by': self.uploader.to_dict() if self.uploader else None,
            'uploaded_at': self.uploaded_at.isoformat() if self.uploaded_at else None
        }

class Log(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    ticket_id = db.Column(db.Integer, db.ForeignKey('ticket.id'), nullable=False)
    action = db.Column(db.Text)
    actor_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    actor = db.relationship('User', backref='actions')

    def to_dict(self):
        return {
            'id': self.id,
            'ticket_id': self.ticket_id,
            'action': self.action,
            'actor': self.actor.to_dict() if self.actor else None,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }

class Notification(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_type = db.Column(db.String(100))
    message = db.Column(db.Text)
    is_read = db.Column(db.Boolean, default=False)
    sent_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'recipient': self.recipient.to_dict() if self.recipient else None,
            'event_type': self.event_type,
            'message': self.message,
            'is_read': self.is_read,
            'sent_at': self.sent_at.isoformat() if self.sent_at else None
        }

