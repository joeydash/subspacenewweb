import { cn } from '../utils/cn';

interface TokenSelectProps {
	value: string;
	onChange: (value: string) => void;
	className?: string;
}

export function TokenSelect({ value, onChange, className }: TokenSelectProps) {
	const tokens = [];
	const loading = false;
	const error = null;

	if (loading) {
		return <div>loading...</div>;
	}

	if (error) {
		return (
			<div className="text-sm text-red-600 dark:text-red-400">
				{error}
			</div>
		);
	}

	return (
		<select
			value={value}
			onChange={(e) => onChange(e.target.value)}
			className={cn(
				"block w-full rounded-md shadow-sm sm:text-sm",
				"border-gray-300 dark:border-gray-600",
				"focus:ring-primary-500 focus:border-primary-500",
				"dark:bg-gray-700 dark:text-white",
				className
			)}
			required
		>
			<option value="">Select an API Key</option>
			{tokens.map((token) => (
				<option key={token.id} value={token.id}>
					{token.name}
				</option>
			))}
		</select>
	);
}