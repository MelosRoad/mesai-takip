import React from 'react';
import { ToolbarProps } from 'react-big-calendar';

export const CustomToolbar: React.FC<ToolbarProps> = (props) => {
    const { onNavigate, label } = props;

    const goToBack = () => {
        onNavigate('PREV');
    };

    const goToNext = () => {
        onNavigate('NEXT');
    };

    const goToCurrent = () => {
        onNavigate('TODAY');
    };

    return (
        <div className="rbc-toolbar">
            <span className="rbc-btn-group">
                <button type="button" onClick={goToBack}>
                    Geri
                </button>
                <button type="button" onClick={goToNext}>
                    İleri
                </button>
            </span>
            <span className="rbc-toolbar-label">{label}</span>
            <span className="rbc-btn-group">
                {/* Empty group to balance flex layout if needed, or remove views */}
            </span>
        </div>
    );
};
