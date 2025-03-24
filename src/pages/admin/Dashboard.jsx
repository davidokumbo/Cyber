import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Layers, Plus, UserPlus } from 'lucide-react';
import { api } from '@/utils/api';
import { toast } from '@/hooks/use-toast';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

const AdminDashboard = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [counts, setCounts] = useState({
    services: 0,
    documents: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [isDocumentDialogOpen, setIsDocumentDialogOpen] = useState(false);
  const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);

  // Redirect if not authenticated or not admin
  useEffect(() => {
    console.log('Admin Dashboard - Auth Status:', { 
      isAuthenticated, 
      isLoading, 
      userRole: user?.role,
      user
    });
    
    if (!isLoading && (!isAuthenticated || !user || user.role !== 'admin')) {
      console.log('Redirecting to login - Not authorized as admin');
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Fetch counts for dashboard
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        setLoading(true);
        
        // Fetch services count
        const servicesResponse = await api.services.getAll();
        const servicesCount = servicesResponse.services ? servicesResponse.services.length : 0;
        
        // Fetch documents count
        const documentsResponse = await api.documents.getAll();
        const documentsCount = documentsResponse.documents ? documentsResponse.documents.length : 0;
        
        // Fetch users count - assuming you have a users API endpoint
        let usersCount = 0;
        try {
          const usersResponse = await api.users.getAll();
          usersCount = usersResponse.users ? usersResponse.users.length : 0;
        } catch (error) {
          console.error('Failed to fetch users count:', error);
          // If users API fails, we'll just use 0
        }
        
        setCounts({
          services: servicesCount,
          documents: documentsCount,
          users: usersCount
        });
      } catch (error) {
        console.error('Failed to fetch dashboard counts:', error);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCounts();
  }, []);

  // Handle opening the respective forms
  const handleOpenDocumentsDialog = () => {
    navigate('/admin/documents');
    setIsDocumentDialogOpen(true);
  };
  
  const handleOpenServicesDialog = () => {
    navigate('/admin/services');
    setIsServiceDialogOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading admin dashboard...</p>
      </div>
    );
  }

  return (
    <AdminLayout title="Admin Dashboard">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Services</CardTitle>
            <CardDescription>Manage your service offerings</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-12 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded mt-2"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">{counts.services}</div>
                <p className="text-sm text-muted-foreground">Active services</p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/admin/services">Manage Services</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Documents</CardTitle>
            <CardDescription>Manage your document library</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-12 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded mt-2"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">{counts.documents}</div>
                <p className="text-sm text-muted-foreground">Available documents</p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/admin/documents">Manage Documents</Link>
            </Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Users</CardTitle>
            <CardDescription>Manage registered users</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse">
                <div className="h-8 w-12 bg-muted rounded"></div>
                <div className="h-4 w-24 bg-muted rounded mt-2"></div>
              </div>
            ) : (
              <>
                <div className="text-3xl font-bold">{counts.users}</div>
                <p className="text-sm text-muted-foreground">Registered users</p>
              </>
            )}
          </CardContent>
          <CardFooter>
            <Button asChild className="w-full">
              <Link to="/admin/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common administrative tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start"
              onClick={handleOpenServicesDialog}
            >
              <Layers className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Add New Service</div>
                <div className="text-sm text-muted-foreground">Create a new service offering</div>
              </div>
            </Button>
            
            <Button 
              variant="outline" 
              className="h-auto py-4 justify-start"
              onClick={handleOpenDocumentsDialog}
            >
              <FileText className="mr-2 h-5 w-5" />
              <div className="text-left">
                <div className="font-semibold">Upload Document</div>
                <div className="text-sm text-muted-foreground">Add a new document to library</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard; 