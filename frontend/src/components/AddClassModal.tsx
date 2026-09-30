import React from 'react';
import { ClassFormModal, ClassFormData } from './ClassFormModal';

export { ClassFormData };

export interface AddClassModalProps {
  visible?: boolean;
  initialData?: ClassFormData | null;
  onSave: (data: ClassFormData) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

/**
 * AddClassModal
 * Backwards-compatible export wrapping ClassFormModal
 * for visual parity with the Web design.
 */
export const AddClassModal: React.FC<AddClassModalProps> = ({
  visible = true,
  initialData,
  onSave,
  onCancel,
  isEditing = false,
}) => {
  if (!visible) return null;

  return (
    <ClassFormModal
      initialData={initialData}
      onSave={onSave}
      onCancel={onCancel}
      isEditing={isEditing}
    />
  );
};

export default AddClassModal;
