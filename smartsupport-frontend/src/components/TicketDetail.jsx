import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowLeft, 
  MessageSquare, 
  User, 
  Calendar, 
  Tag,
  AlertCircle,
  Send,
  Edit,
  Save,
  X
} from 'lucide-react';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isEndUser, isAgent, isAdmin } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  
  // Comment form
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  
  // Edit form
  const [editForm, setEditForm] = useState({});
  const [statuses, setStatuses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadTicket();
    if (!isEndUser) {
      loadFormOptions();
    }
  }, [id]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTicket(id);
      setTicket(response.ticket);
      setEditForm({
        subject: response.ticket.subject,
        description: response.ticket.description,
        priority: response.ticket.priority,
        status: response.ticket.status?.id,
        category_id: response.ticket.category?.id,
        assigned_to: response.ticket.assigned_to?.id
      });
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadFormOptions = async () => {
    try {
      const [statusesResponse, categoriesResponse, usersResponse] = await Promise.all([
        apiService.getTicketStatuses(),
        apiService.getCategories(),
        isAdmin ? apiService.getUsers() : Promise.resolve({ users: [] })
      ]);
      setStatuses(statusesResponse.statuses);
      setCategories(categoriesResponse.categories);
      setUsers(usersResponse.users || []);
    } catch (error) {
      console.error('Failed to load form options:', error);
    }
  };

  const handleUpdateTicket = async () => {
    try {
      const response = await apiService.updateTicket(id, editForm);
      setTicket(response.ticket);
      setEditing(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      await apiService.addComment(id, {
        comment_text: newComment,
        is_internal: isInternal
      });
      setNewComment('');
      setIsInternal(false);
      await loadTicket(); // Reload to get updated comments
    } catch (error) {
      setError(error.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.name?.toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-purple-100 text-purple-800';
      case 'on hold': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900">Ticket not found</h3>
          <Link to="/tickets">
            <Button className="mt-4">Back to Tickets</Button>
          </Link>
        </div>
      </div>
    );
  }

  const canEdit = isAdmin || isAgent || (isEndUser && ticket.created_by?.id === user?.id);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <Button variant="outline" onClick={() => navigate('/tickets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tickets
          </Button>
          {canEdit && !editing && (
            <Button variant="outline" onClick={() => setEditing(true)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Ticket
            </Button>
          )}
          {editing && (
            <div className="flex space-x-2">
              <Button onClick={handleUpdateTicket}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-900">
            Ticket #{ticket.id}
          </h1>
          <Badge className={getPriorityColor(ticket.priority)}>
            {ticket.priority}
          </Badge>
          <Badge className={getStatusColor(ticket.status)}>
            {ticket.status?.name}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm(prev => ({ ...prev, subject: e.target.value }))}
                    className="w-full p-2 border rounded"
                    disabled={isEndUser}
                  />
                ) : (
                  ticket.subject
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editing ? (
                <Textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                  rows={6}
                  placeholder="Ticket description..."
                />
              ) : (
                <div className="whitespace-pre-wrap text-gray-700">
                  {ticket.description}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>Comments ({ticket.comments?.length || 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ticket.comments?.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-gray-200 pl-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{comment.user?.name}</span>
                        {comment.is_internal && (
                          <Badge variant="secondary" className="text-xs">Internal</Badge>
                        )}
                      </div>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.created_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-gray-700 whitespace-pre-wrap">
                      {comment.comment_text}
                    </div>
                  </div>
                ))}

                {/* Add Comment Form */}
                <form onSubmit={handleAddComment} className="mt-6 pt-6 border-t">
                  <div className="space-y-4">
                    <Textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Add a comment..."
                      rows={4}
                      required
                    />
                    
                    {(isAgent || isAdmin) && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="internal"
                          checked={isInternal}
                          onCheckedChange={setIsInternal}
                        />
                        <label htmlFor="internal" className="text-sm">
                          Internal comment (not visible to end user)
                        </label>
                      </div>
                    )}
                    
                    <Button type="submit" disabled={submittingComment}>
                      <Send className="h-4 w-4 mr-2" />
                      {submittingComment ? 'Adding...' : 'Add Comment'}
                    </Button>
                  </div>
                </form>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                {editing && (isAgent || isAdmin) ? (
                  <Select 
                    value={editForm.status?.toString()} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, status: parseInt(value) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status.id} value={status.id.toString()}>
                          {status.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getStatusColor(ticket.status)}>
                      {ticket.status?.name}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Priority</label>
                {editing && (isAgent || isAdmin) ? (
                  <Select 
                    value={editForm.priority} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Low">Low</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1">
                    <Badge className={getPriorityColor(ticket.priority)}>
                      {ticket.priority}
                    </Badge>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Category</label>
                {editing && (isAgent || isAdmin) ? (
                  <Select 
                    value={editForm.category_id?.toString()} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, category_id: parseInt(value) }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-sm text-gray-900">
                    {ticket.category?.name || 'No category'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Assigned To</label>
                {editing && isAdmin ? (
                  <Select 
                    value={editForm.assigned_to?.toString()} 
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, assigned_to: value ? parseInt(value) : null }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Unassigned" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Unassigned</SelectItem>
                      {users.filter(u => u.role !== 'End-User').map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="mt-1 text-sm text-gray-900">
                    {ticket.assigned_to?.name || 'Unassigned'}
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Created By</label>
                <div className="mt-1 flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">{ticket.created_by?.name}</span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Created</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(ticket.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">Last Updated</label>
                <div className="mt-1 flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-900">
                    {new Date(ticket.updated_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;

