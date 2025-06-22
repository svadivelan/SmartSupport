import os
import sys
# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from flask import Flask, send_from_directory
from flask_cors import CORS
from src.models.user import db, User, TicketStatus, Category, SLAPolicy
from src.routes.auth import auth_bp
from src.routes.tickets import tickets_bp
from src.routes.admin import admin_bp

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))
app.config['SECRET_KEY'] = 'asdf#FGSgvasgf$5$WGT'

# Enable CORS for all routes
CORS(app, supports_credentials=True)

# Register blueprints
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(tickets_bp, url_prefix='/api')
app.register_blueprint(admin_bp, url_prefix='/api/admin')

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db.init_app(app)

def init_default_data():
    """Initialize default data for the application"""
    # Create default ticket statuses
    default_statuses = [
        {'name': 'Open', 'order': 1, 'is_terminal': False},
        {'name': 'In Progress', 'order': 2, 'is_terminal': False},
        {'name': 'On Hold', 'order': 3, 'is_terminal': False},
        {'name': 'Resolved', 'order': 4, 'is_terminal': True},
        {'name': 'Closed', 'order': 5, 'is_terminal': True}
    ]
    
    for status_data in default_statuses:
        if not TicketStatus.query.filter_by(name=status_data['name']).first():
            status = TicketStatus(**status_data)
            db.session.add(status)
    
    # Create default categories
    default_categories = [
        {'name': 'Technical', 'description': 'Technical support issues'},
        {'name': 'Billing', 'description': 'Billing and payment related issues'},
        {'name': 'General', 'description': 'General inquiries and support'},
        {'name': 'Bug Report', 'description': 'Software bugs and issues'},
        {'name': 'Feature Request', 'description': 'New feature requests'}
    ]
    
    for category_data in default_categories:
        if not Category.query.filter_by(name=category_data['name']).first():
            category = Category(**category_data)
            db.session.add(category)
    
    # Create default SLA policy
    if not SLAPolicy.query.filter_by(name='Standard').first():
        sla_policy = SLAPolicy(
            name='Standard',
            response_time_minutes=240,  # 4 hours
            resolution_time_minutes=2880,  # 48 hours
            active=True
        )
        sla_policy.set_escalation_policy({
            'levels': [
                {'time_minutes': 240, 'action': 'notify_supervisor'},
                {'time_minutes': 480, 'action': 'escalate_to_manager'}
            ]
        })
        db.session.add(sla_policy)
    
    # Create default admin user
    if not User.query.filter_by(email='admin@smartsupport.com').first():
        admin_user = User(
            name='System Administrator',
            email='admin@smartsupport.com',
            role='Admin'
        )
        admin_user.set_password('admin123')
        db.session.add(admin_user)
    
    # Create sample agent user
    if not User.query.filter_by(email='agent@smartsupport.com').first():
        agent_user = User(
            name='Support Agent',
            email='agent@smartsupport.com',
            role='Agent'
        )
        agent_user.set_password('agent123')
        db.session.add(agent_user)
    
    # Create sample end user
    if not User.query.filter_by(email='user@example.com').first():
        end_user = User(
            name='John Doe',
            email='user@example.com',
            role='End-User'
        )
        end_user.set_password('user123')
        db.session.add(end_user)
    
    db.session.commit()

with app.app_context():
    db.create_all()
    init_default_data()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
        return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)

