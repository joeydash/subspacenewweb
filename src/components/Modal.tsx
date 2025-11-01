import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../utils/cn';

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	hideCloseButton?: boolean;
	title: string;
	children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children, hideCloseButton }: ModalProps) {
	if (!isOpen) return null;

	const modalContent = (
		<div className="fixed inset-0 z-50 overflow-y-auto" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
			<div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
				{/* Semi-transparent backdrop */}
				<div
					className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
					style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 40 }}
					onClick={hideCloseButton ? undefined : onClose}
				/>

				<div className={cn(
					"relative transform overflow-visible rounded-lg", // Changed from overflow-hidden
					"bg-white/95 dark:bg-gray-800 text-left shadow-xl transition-all",
					"w-full max-w-[calc(100vw-2rem)] sm:max-w-5xl sm:w-full", // Increased max-width from 3xl to 5xl
					"min-h-[10rem]",
					"z-50" // Ensure modal content is above backdrop
				)} style={{ zIndex: 50, position: 'relative' }}>
					{/* Header */}
					<div className="px-4 py-3 sm:px-6 border-b border-gray-200 dark:border-gray-600 flex items-center justify-between">
						<h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
							{title}
						</h3>
						{!hideCloseButton && (
							<button
								onClick={() => {
									onClose();
								}}
								className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-100 focus:outline-none"
							>
								<X className="h-5 w-5" />
							</button>
						)}
					</div>

					{/* Content */}
					<div className="px-4 pb-4 pt-5 sm:p-6 sm:pb-4 text-gray-800 dark:text-gray-200">
						{children}
					</div>
				</div>
			</div>
		</div>
	);

	// Use Portal for better Firefox compatibility
	return typeof document !== 'undefined'
		? createPortal(modalContent, document.body)
		: modalContent;
}