
import { DebugSection } from "./DebugSection";
import { CodeBlock } from "./CodeBlock";

interface ErrorSectionProps {
  error?: {
    type: string;
    message: string;
    stack?: string;
    responseText?: string;
  };
}

export const ErrorSection = ({ error }: ErrorSectionProps) => {
  if (!error) return null;

  return (
    <DebugSection
      title="Error"
      titleColor="rgb(239, 68, 68)" // text-red-500
      variant="error"
    >
      <div>Type: {error.type || 'Unknown Error'}</div>
      <div>Message: {error.message || String(error)}</div>
      
      {error.stack && (
        <div className="mt-2">
          <div className="text-xs text-red-400 mb-1">Stack Trace:</div>
          <div className="overflow-x-auto bg-black/20 p-2 rounded whitespace-pre-wrap">
            <pre className="text-xs">{error.stack}</pre>
          </div>
        </div>
      )}
      
      {error.responseText && (
        <div className="mt-2">
          <div className="text-xs text-red-400 mb-1">Response Text:</div>
          <CodeBlock 
            content={error.responseText} 
            label="Error response text" 
            showCopyButton={false}
          />
        </div>
      )}
    </DebugSection>
  );
};
