import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, X } from 'lucide-react';

interface DemoAccountRestrictionPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const DemoAccountRestrictionPopup: React.FC<DemoAccountRestrictionPopupProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
              Demo Account Restriction
            </CardTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="space-y-3">
            <p className="text-gray-700">
              Changes are not allowed for demo accounts. This is a safety measure to prevent accidental modifications to demo trading environments.
            </p>
            <p className="text-sm text-gray-600">
              To make changes, please use a non-demo account or contact your administrator.
            </p>
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              Understood
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DemoAccountRestrictionPopup;
