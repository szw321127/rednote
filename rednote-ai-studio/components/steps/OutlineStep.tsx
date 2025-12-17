import { ArrowLeft } from "lucide-react";
import React, { useState } from "react";
import { Outline } from "../../types";
import { OutlineCard } from "../OutlineCard";
import { OutlineEditModal } from "../OutlineEditModal";

interface OutlineStepProps {
  outlines: Outline[];
  onSelectOutline: (outline: Outline) => void;
  onEditOutline: (outline: Outline) => void;
  onRegenerateOutlines: () => void;
  onBackToTopic: () => void;
}

export const OutlineStep: React.FC<OutlineStepProps> = ({
  outlines,
  onSelectOutline,
  onEditOutline,
  onRegenerateOutlines,
  onBackToTopic,
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOutline, setEditingOutline] = useState<Outline | null>(null);

  const handleEdit = (outline: Outline) => {
    setEditingOutline(outline);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (updatedOutline: Outline) => {
    onEditOutline(updatedOutline);
    setIsEditModalOpen(false);
    setEditingOutline(null);
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingOutline(null);
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">选择一个大纲</h2>
            <p className="text-sm text-gray-500 mt-1">
              共生成 {outlines.length} 个创意方向（最多9个）
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onBackToTopic}
              className="text-sm text-gray-500 hover:text-xhs-red flex items-center bg-white border border-gray-200 px-3 py-1.5 rounded-lg shadow-sm"
            >
              <ArrowLeft size={14} className="mr-1" /> 修改选题
            </button>
            {outlines.length < 9 && (
              <button
                onClick={onRegenerateOutlines}
                className="text-sm text-white bg-xhs-red hover:bg-red-600 flex items-center px-3 py-1.5 rounded-lg shadow-sm transition-colors"
              >
                再生成一批
              </button>
            )}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {outlines.map((outline) => (
            <OutlineCard
              key={outline.id}
              outline={outline}
              onSelect={onSelectOutline}
              onEdit={handleEdit}
            />
          ))}
        </div>
      </div>

      <OutlineEditModal
        outline={editingOutline}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveEdit}
      />
    </>
  );
};
