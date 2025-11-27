'use client';

import { useState } from 'react';
import { useShelves } from '@/hooks/useShelves';
import ShelfDisplay from './ShelfDisplay';

export default function ShelfManager() {
  const { shelves, createShelf, deleteShelf, renameShelf } = useShelves();
  const [newShelfName, setNewShelfName] = useState('');
  const [editingShelfId, setEditingShelfId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreateShelf = (e: React.FormEvent) => {
    e.preventDefault();
    if (newShelfName.trim()) {
      createShelf(newShelfName.trim());
      setNewShelfName('');
    }
  };

  const handleStartEdit = (shelfId: string, currentName: string) => {
    setEditingShelfId(shelfId);
    setEditingName(currentName);
  };

  const handleSaveEdit = (shelfId: string) => {
    if (editingName.trim()) {
      renameShelf(shelfId, editingName.trim());
    }
    setEditingShelfId(null);
    setEditingName('');
  };

  const handleCancelEdit = () => {
    setEditingShelfId(null);
    setEditingName('');
  };

  return (
    <div className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-3xl font-bold text-white">My Shelves</h2>
        <form onSubmit={handleCreateShelf} className="flex gap-2">
          <input
            type="text"
            value={newShelfName}
            onChange={(e) => setNewShelfName(e.target.value)}
            placeholder="New shelf name..."
            className="px-4 py-2 rounded-lg bg-gray-800 text-white placeholder-gray-400 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            required
          />
          <button
            type="submit"
            className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg transition-colors"
          >
            Create Shelf
          </button>
        </form>
      </div>

      {shelves.length === 0 ? (
        <div className="text-center py-12 bg-gray-900/50 rounded-lg border border-gray-800">
          <p className="text-gray-400 text-lg mb-2">No shelves yet</p>
          <p className="text-gray-500 text-sm">
            Create a shelf to start organizing your favorite albums
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {shelves.map((shelf) => (
            <div key={shelf.id} className="bg-gray-900/50 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                {editingShelfId === shelf.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="px-3 py-1 rounded bg-gray-800 text-white border border-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveEdit(shelf.id);
                        } else if (e.key === 'Escape') {
                          handleCancelEdit();
                        }
                      }}
                    />
                    <button
                      onClick={() => handleSaveEdit(shelf.id)}
                      className="px-3 py-1 bg-green-500 hover:bg-green-600 text-white rounded text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-2xl font-bold text-white">{shelf.name}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleStartEdit(shelf.id, shelf.name)}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => deleteShelf(shelf.id)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
              <ShelfDisplay shelf={shelf} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

