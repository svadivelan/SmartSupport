import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users, 
  Settings, 
  Tag, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Save,
  X
} from 'lucide-react';

const AdminPanel = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  
  // Users
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  
  // Ticket Statuses
  const [statuses, setStatuses] = useState([]);
  const [statusesLoading, setStatusesLoading] = useState(true);
  
  // Categories
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  
  // Forms
  const [editingUser, setEditingUser] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [newStatus, setNewStatus] = useState({ name: '', order: 0, is_terminal: false });
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadUsers();
    loadStatuses();
    loadCategories();
  }, []);

  const loadUsers = async () => {
    try {
      setUsersLoading(true);
      const response = await apiService.getUsers();
      setUsers(response.users);
    } catch (error) {
      setError('Failed to load users');
    } finally {
      setUsersLoading(false);
    }
  };

  const loadStatuses = async () => {
    try {
      setStatusesLoading(true);
      const response = await apiService.getTicketStatuses();
      setStatuses(response.statuses);
    } catch (error) {
      setError('Failed to load statuses');
    } finally {
      setStatusesLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategoriesLoading(true);
      const response = await apiService.getCategories();
      setCategories(response.categories);
    } catch (error) {
      setError('Failed to load categories');
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleUpdateUser = async (userId, userData) => {
    try {
      await apiService.updateUser(userId, userData);
      setSuccess('User updated successfully');
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      await apiService.deleteUser(userId);
      setSuccess('User deleted successfully');
      loadUsers();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateStatus = async () => {
    try {
      await apiService.createTicketStatus(newStatus);
      setSuccess('Status created successfully');
      setNewStatus({ name: '', order: 0, is_terminal: false });
      loadStatuses();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateStatus = async (statusId, statusData) => {
    try {
      await apiService.updateTicketStatus(statusId, statusData);
      setSuccess('Status updated successfully');
      setEditingStatus(null);
      loadStatuses();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteStatus = async (statusId) => {
    if (!confirm('Are you sure you want to delete this status?')) return;
    
    try {
      await apiService.deleteTicketStatus(statusId);
      setSuccess('Status deleted successfully');
      loadStatuses();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleCreateCategory = async () => {
    try {
      await apiService.createCategory(newCategory);
      setSuccess('Category created successfully');
      setNewCategory({ name: '', description: '' });
      loadCategories();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleUpdateCategory = async (categoryId, categoryData) => {
    try {
      await apiService.updateCategory(categoryId, categoryData);
      setSuccess('Category updated successfully');
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      setError(error.message);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await apiService.deleteCategory(categoryId);
      setSuccess('Category deleted successfully');
      loadCategories();
    } catch (error) {
      setError(error.message);
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin': return 'bg-red-100 text-red-800';
      case 'Agent': return 'bg-blue-100 text-blue-800';
      case 'L1': return 'bg-green-100 text-green-800';
      case 'L2': return 'bg-yellow-100 text-yellow-800';
      case 'L3': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage users, ticket statuses, categories, and system settings
        </p>
      </div>

      {/* Alerts */}
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="mb-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="statuses" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Ticket Statuses</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Tag className="h-4 w-4" />
            <span>Categories</span>
          </TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts and roles
              </CardDescription>
            </CardHeader>
            <CardContent>
              {usersLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {users.map((userItem) => (
                    <div key={userItem.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <h3 className="font-medium">{userItem.name}</h3>
                            <p className="text-sm text-gray-500">{userItem.email}</p>
                          </div>
                          <Badge className={getRoleColor(userItem.role)}>
                            {userItem.role}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingUser(userItem)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit User</DialogTitle>
                              <DialogDescription>
                                Update user information and role
                              </DialogDescription>
                            </DialogHeader>
                            {editingUser && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editingUser.name}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label>Email</Label>
                                  <Input
                                    value={editingUser.email}
                                    onChange={(e) => setEditingUser(prev => ({ ...prev, email: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label>Role</Label>
                                  <Select 
                                    value={editingUser.role} 
                                    onValueChange={(value) => setEditingUser(prev => ({ ...prev, role: value }))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="End-User">End User</SelectItem>
                                      <SelectItem value="L1">L1 Agent</SelectItem>
                                      <SelectItem value="L2">L2 Agent</SelectItem>
                                      <SelectItem value="L3">L3 Agent</SelectItem>
                                      <SelectItem value="Agent">Agent</SelectItem>
                                      <SelectItem value="Admin">Admin</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    variant="outline" 
                                    onClick={() => setEditingUser(null)}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    onClick={() => handleUpdateUser(editingUser.id, editingUser)}
                                  >
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        {userItem.id !== user?.id && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => handleDeleteUser(userItem.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statuses Tab */}
        <TabsContent value="statuses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Status Management</CardTitle>
              <CardDescription>
                Configure ticket statuses and workflow
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Create New Status */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-4">Create New Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newStatus.name}
                      onChange={(e) => setNewStatus(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Status name"
                    />
                  </div>
                  <div>
                    <Label>Order</Label>
                    <Input
                      type="number"
                      value={newStatus.order}
                      onChange={(e) => setNewStatus(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                    />
                  </div>
                  <div className="flex items-end">
                    <Button onClick={handleCreateStatus} disabled={!newStatus.name}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Status
                    </Button>
                  </div>
                </div>
              </div>

              {/* Existing Statuses */}
              {statusesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {statuses.map((status) => (
                    <div key={status.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-medium">{status.name}</h3>
                          <span className="text-sm text-gray-500">Order: {status.order}</span>
                          {status.is_terminal && (
                            <Badge variant="secondary">Terminal</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingStatus(status)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Status</DialogTitle>
                            </DialogHeader>
                            {editingStatus && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editingStatus.name}
                                    onChange={(e) => setEditingStatus(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label>Order</Label>
                                  <Input
                                    type="number"
                                    value={editingStatus.order}
                                    onChange={(e) => setEditingStatus(prev => ({ ...prev, order: parseInt(e.target.value) }))}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setEditingStatus(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleUpdateStatus(editingStatus.id, editingStatus)}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteStatus(status.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Category Management</CardTitle>
              <CardDescription>
                Organize tickets by categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Create New Category */}
              <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                <h3 className="font-medium mb-4">Create New Category</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Name</Label>
                    <Input
                      value={newCategory.name}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Category name"
                    />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Input
                      value={newCategory.description}
                      onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Category description"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <Button onClick={handleCreateCategory} disabled={!newCategory.name}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Category
                  </Button>
                </div>
              </div>

              {/* Existing Categories */}
              {categoriesLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse h-16 bg-gray-200 rounded"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <h3 className="font-medium">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" onClick={() => setEditingCategory(category)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Edit Category</DialogTitle>
                            </DialogHeader>
                            {editingCategory && (
                              <div className="space-y-4">
                                <div>
                                  <Label>Name</Label>
                                  <Input
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory(prev => ({ ...prev, name: e.target.value }))}
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Input
                                    value={editingCategory.description}
                                    onChange={(e) => setEditingCategory(prev => ({ ...prev, description: e.target.value }))}
                                  />
                                </div>
                                <div className="flex justify-end space-x-2">
                                  <Button variant="outline" onClick={() => setEditingCategory(null)}>
                                    Cancel
                                  </Button>
                                  <Button onClick={() => handleUpdateCategory(editingCategory.id, editingCategory)}>
                                    Save Changes
                                  </Button>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                        
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPanel;

