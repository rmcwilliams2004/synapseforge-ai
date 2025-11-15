import React, { useState, useEffect, useRef } from 'react';
import { Comment, User, Role } from '../../types';
import { Modal } from '../Modal';

interface CommentModalProps {
    isOpen: boolean;
    sectionId: string;
    sectionTitle: string;
    onClose: () => void;
    authenticatedUser: User;
    comments: Comment[];
    onAddComment: (text: string) => void;
}

const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString();
};

export const CommentSidebar: React.FC<CommentModalProps> = ({ isOpen, sectionTitle, onClose, authenticatedUser, comments, onAddComment }) => {
    const [newComment, setNewComment] = useState('');
    const endOfCommentsRef = useRef<HTMLDivElement>(null);

     useEffect(() => {
        if(isOpen) {
            // Delay scroll to allow modal to render
            setTimeout(() => {
                endOfCommentsRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    }, [comments, isOpen]);


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        onAddComment(newComment.trim());
        setNewComment('');
    };
    
    const isViewer = authenticatedUser.role === Role.Viewer;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={`Comments on: ${sectionTitle}`}
            confirmText="Close"
            onConfirm={onClose}
            cancelText={null}
        >
            <div className="flex flex-col max-h-[60vh] -my-4">
                <div className="flex-1 pr-2 -mr-4 overflow-y-auto space-y-4 py-4">
                    {comments.length === 0 && (
                        <p className="text-center text-sm text-gray-500 pt-8">No comments on this section yet.</p>
                    )}
                    {comments.map(comment => (
                        <div key={comment.id} className="flex items-start gap-3 animate-fade-in" style={{animationDuration: '0.3s'}}>
                            <img src={comment.userPicture} alt={comment.userName} className="w-8 h-8 rounded-full mt-1" />
                            <div className="flex-1">
                                <div className="bg-gray-700 p-3 rounded-lg">
                                    <p className="text-sm text-gray-200">{comment.text}</p>
                                </div>
                                <div className="flex items-center justify-between mt-1 px-2">
                                    <span className="text-xs font-semibold text-gray-300">{comment.userName}</span>
                                    <span className="text-xs text-gray-500">{formatDate(comment.createdAt)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                     <div ref={endOfCommentsRef} />
                </div>

                {!isViewer && (
                    <form onSubmit={handleSubmit} className="flex-shrink-0 pt-4 mt-4 border-t border-gray-700">
                        <div className="flex items-start gap-2">
                            <img src={authenticatedUser.picture} alt="Your avatar" className="w-8 h-8 rounded-full" />
                            <div className="flex-1">
                                <textarea
                                    value={newComment}
                                    onChange={e => setNewComment(e.target.value)}
                                    placeholder="Add a comment..."
                                    rows={3}
                                    className="w-full p-2 text-sm bg-gray-900 border border-gray-600 rounded-lg focus:ring-2 focus:ring-brand-cyan"
                                />
                                <button type="submit" className="w-full mt-2 py-2 px-4 bg-brand-cyan text-white font-bold text-sm rounded-lg hover:bg-cyan-500 transition active:scale-95 disabled:opacity-50" disabled={!newComment.trim()}>
                                    Post Comment
                                </button>
                            </div>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    );
};
