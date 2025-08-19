import { useState, useEffect } from 'react';
import { XMarkIcon, TagIcon, PencilIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';
import { categoryAPI } from '../../services/api';
import Button from '../ui/Button';

const CategoryModal = ({ onClose, onSave }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryAPI.getAll();
      const categoriesData = response.data.results || response.data || [];
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error fetching categories:', error);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const response = await categoryAPI.create({ name: newCategoryName.trim() });
      setCategories(prev => [...prev, response.data]);
      setNewCategoryName('');
      setSuccess('Category added successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error creating category:', error);
      setError('Failed to create category');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleEditCategory = async (categoryId) => {
    if (!editName.trim()) {
      setError('Category name is required');
      return;
    }

    try {
      const response = await categoryAPI.update(categoryId, { name: editName.trim() });
      setCategories(prev => prev.map(cat => 
        cat.id === categoryId ? response.data : cat
      ));
      setEditingCategory(null);
      setEditName('');
      setSuccess('Category updated successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating category:', error);
      setError('Failed to update category');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (window.confirm('Are you sure you want to delete this category? Products using this category will be uncategorized.')) {
      try {
        await categoryAPI.delete(categoryId);
        setCategories(prev => prev.filter(cat => cat.id !== categoryId));
        setSuccess('Category deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting category:', error);
        setError('Failed to delete category');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const startEdit = (category) => {
    setEditingCategory(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setEditName('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <TagIcon className="w-6 h-6 mr-2" />
            Manage Categories
          </h2>
          <button
            onClick={onClose}
            className="text-green-100 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          
          {/* Messages */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-sm">
              {success}
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* Add New Category */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="flex space-x-3">
              <input
                type="text"
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter category name"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                <PlusIcon className="w-4 h-4 mr-2" />
                Add
              </Button>
            </form>
          </div>

          {/* Categories List */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Existing Categories ({categories.length})
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading categories...</p>
              </div>
            ) : categories.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    {editingCategory === category.id ? (
                      <div className="flex-1 flex items-center space-x-2">
                        <input
                          type="text"
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          onClick={() => handleEditCategory(category.id)}
                          disabled={!editName.trim()}
                        >
                          Save
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                        >
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex-1">
                          <span className="font-medium text-gray-900">{category.name}</span>
                          <span className="text-sm text-gray-500 ml-2">
                            ({category.product_count || 0} products)
                          </span>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(category)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <PencilIcon className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <TrashIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <TagIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">No categories found</p>
                <p className="text-sm text-gray-400">Add your first category above</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 pt-6 mt-6 border-t border-gray-200">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => {
                onSave();
                onClose();
              }}
              className="bg-green-600 hover:bg-green-700"
            >
              Done
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategoryModal;