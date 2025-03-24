import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import AdminLayout from '@/components/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { 
  Pencil, 
  Trash, 
  Plus,
  Eye
} from 'lucide-react';
import { api, handleApiError } from '@/utils/api';
import { toast } from '@/hooks/use-toast';

// Helper function to format dates to dd/mm/yyyy
const formatDate = (dateString) => {
  if (!dateString) return 'Loading...';
  
  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return 'Loading...';
    
    // Format as dd/mm/yyyy
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    
    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Loading...';
  }
};

const AdminDocuments = () => {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    category: '',
    document: null,
    thumbnail: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [categories, setCategories] = useState(['templates', 'legal', 'finance', 'marketing', 'other']);
  const [showCustomCategoryInput, setShowCustomCategoryInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isLoading && (!isAuthenticated || !user || user.role !== 'admin')) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, user, navigate]);

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await api.documents.getAll();
        if (response.documents && Array.isArray(response.documents)) {
          // Pre-process documents to ensure dates are valid
          const processedDocuments = response.documents.map(doc => ({
            ...doc,
            // Ensure created_at is a valid date string
            created_at: doc.created_at ? new Date(doc.created_at).toISOString() : null
          }));
          
          setDocuments(processedDocuments);
          
          // Extract unique categories
          if (processedDocuments.length > 0) {
            const uniqueCategories = [...new Set(processedDocuments.map(doc => doc.category))];
            if (uniqueCategories.length > 0) {
              // Filter out null or undefined categories and add default categories
              setCategories([
                ...new Set([
                  ...categories,
                  ...uniqueCategories.filter(cat => cat)
                ])
              ]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch documents:', error);
        toast({
          title: 'Error',
          description: 'Failed to load documents.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    if (value === "custom") {
      setShowCustomCategoryInput(true);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      setShowCustomCategoryInput(false);
    }
  };

  const handleCustomCategoryChange = (e) => {
    setCustomCategory(e.target.value);
  };

  const addCustomCategory = () => {
    if (customCategory.trim()) {
      // Normalize the category (lowercase, no spaces)
      const normalizedCategory = customCategory.trim().toLowerCase().replace(/\s+/g, '-');
      
      // Add the new category if it doesn't already exist
      if (!categories.includes(normalizedCategory)) {
        setCategories(prev => [...prev, normalizedCategory]);
        toast({
          title: 'Category Added',
          description: `Added new category: ${normalizedCategory}`,
        });
      }
      
      // Set the form data to use this new category
      setFormData(prev => ({ ...prev, category: normalizedCategory }));
      
      // Reset the custom category input
      setCustomCategory('');
      setShowCustomCategoryInput(false);
    }
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    setFormData(prev => ({ ...prev, [name]: files[0] }));
  };

  const resetForm = () => {
    setFormData({
      id: '',
      title: '',
      description: '',
      category: '',
      document: null,
      thumbnail: null
    });
    setIsEditing(false);
  };

  const handleEdit = (document) => {
    setFormData({
      id: document.id,
      title: document.title,
      description: document.description,
      category: document.category || 'other',
      document: null,
      thumbnail: null
    });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // If we have a custom category pending, add it first
    if (showCustomCategoryInput && customCategory.trim()) {
      addCustomCategory();
    }
    
    try {
      const formPayload = new FormData();
      formPayload.append('title', formData.title);
      formPayload.append('description', formData.description);
      formPayload.append('category', formData.category);
      
      if (formData.document) {
        formPayload.append('document', formData.document);
      }
      
      if (formData.thumbnail) {
        formPayload.append('thumbnail', formData.thumbnail);
      }

      let response;
      if (isEditing) {
        response = await api.documents.update(formData.id, formPayload);
        toast({
          title: 'Success',
          description: 'Document updated successfully',
        });
        
        // Update documents list
        setDocuments(prevDocuments => 
          prevDocuments.map(doc => 
            doc.id === formData.id ? { ...doc, ...response.document } : doc
          )
        );
      } else {
        if (!formData.document) {
          throw new Error('Document file is required');
        }
        
        response = await api.documents.create(formPayload);
        toast({
          title: 'Success',
          description: 'Document created successfully',
        });
        
        // Add new document to list
        setDocuments(prevDocuments => [...prevDocuments, response.document]);
      }

      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      handleApiError(error);
    }
  };

  const confirmDelete = (document) => {
    setDocumentToDelete(document);
    setShowDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;
    
    try {
      await api.documents.delete(documentToDelete.id);
      
      // Remove from documents list
      setDocuments(prevDocuments => 
        prevDocuments.filter(doc => doc.id !== documentToDelete.id)
      );
      
      toast({
        title: 'Success',
        description: 'Document deleted successfully',
      });
    } catch (error) {
      handleApiError(error);
    } finally {
      setDocumentToDelete(null);
      setShowDeleteDialog(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg">Loading documents...</p>
      </div>
    );
  }

  return (
    <AdminLayout title="Manage Documents">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Documents Library</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setIsEditing(false); }}>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{isEditing ? 'Edit Document' : 'Upload New Document'}</DialogTitle>
                <DialogDescription>
                  {isEditing ? 'Update document details below.' : 'Fill in the details to upload a new document.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Title</Label>
                    <Input 
                      id="title" 
                      name="title" 
                      value={formData.title} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea 
                      id="description" 
                      name="description" 
                      value={formData.description} 
                      onChange={handleInputChange} 
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="category">Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => handleSelectChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          <SelectLabel>Existing Categories</SelectLabel>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category.charAt(0).toUpperCase() + category.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                        <SelectSeparator />
                        <SelectItem value="custom" className="text-primary font-medium">
                          + Add custom category
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {showCustomCategoryInput && (
                      <div className="mt-2 grid grid-cols-[1fr,auto] gap-2">
                        <Input
                          placeholder="Enter new category name"
                          value={customCategory}
                          onChange={handleCustomCategoryChange}
                        />
                        <Button 
                          type="button" 
                          size="sm"
                          onClick={addCustomCategory}
                          disabled={!customCategory.trim()}
                        >
                          Add
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="document">Document File {!isEditing && <span className="text-sm text-muted-foreground">(Required for new uploads)</span>}</Label>
                    <Input 
                      id="document" 
                      name="document" 
                      type="file" 
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.jpg,.jpeg,.png,.gif,.odt,.ods,.odp" 
                      onChange={handleFileChange} 
                      required={!isEditing}
                    />
                    <p className="text-xs text-muted-foreground">
                      The document will be displayed directly in the preview with a blur effect on a portion of the content. 
                      Supported formats include PDF, Office documents (DOC, DOCX, PPT, PPTX, XLS, XLSX), 
                      images (JPG, PNG, GIF), text files (TXT), and OpenDocument formats.
                    </p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="thumbnail">Thumbnail Image (Optional)</Label>
                    <Input 
                      id="thumbnail" 
                      name="thumbnail" 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {isEditing ? 'Update Document' : 'Upload Document'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p>Loading documents...</p>
            </div>
          ) : documents.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Date Added</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.id}</TableCell>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{doc.category || 'Uncategorized'}</TableCell>
                    <TableCell>{formatDate(doc.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="mr-1" onClick={() => {
                        const downloadUrl = `http://localhost:5000${doc.document_path}`;
                        window.open(downloadUrl, '_blank');
                      }}>
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Download</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(doc)} className="mr-1">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => confirmDelete(doc)} className="text-destructive">
                        <Trash className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No documents found. Upload your first document!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the document "{documentToDelete?.title}". This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminDocuments; 