
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { invokeFunctionWithRetry } from "@/config/api";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Currency } from "@/types/bridge";
import { AlertCircle, CheckCircle, XCircle, AlertTriangle, Trash2, Code, Info, Copy } from "lucide-react";

interface DebugPanelProps {
  availableCurrencies: Currency[];
  isLoadingCurrencies: boolean;
}

export const DebugPanel = ({ availableCurrencies, isLoadingCurrencies }: DebugPanelProps) => {
  const [showDebug, setShowDebug] = useState(true);
  const [testResults, setTestResults] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);
  const [currencies, setCurrencies] = useState<any>(null);
  const [testTimestamp, setTestTimestamp] = useState<string | null>(null);
  const [currenciesTimestamp, setCurrenciesTimestamp] = useState<string | null>(null);
  const [showRawRequest, setShowRawRequest] = useState(false);
  const [showFullResponse, setShowFullResponse] = useState(false);
  const [expandedSections, setExpandedSections] = useState<{[key: string]: boolean}>({
    signatureDetails: false,
    requestDetails: false,
    responseDetails: false,
  });

  const handleTestAuth = async () => {
    setIsLoading(true);
    try {
      const results = await invokeFunctionWithRetry('ff-auth-test');
      setTestResults(results);
      setTestTimestamp(results.timestamp || new Date().toISOString());
      
      if (results.success) {
        toast({
          title: "Authentication Test Successful",
          description: results.message || "Successfully connected to FixedFloat API!",
        });
      } else {
        toast({
          title: "Authentication Test Failed",
          description: results.message || "Failed to connect to FixedFloat API. Check results for details.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Auth test error:", error);
      setTestTimestamp(new Date().toISOString());
      toast({
        title: "Test Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestCurrencies = async () => {
    setCurrenciesLoading(true);
    try {
      const results = await invokeFunctionWithRetry('ff-currencies');
      setCurrencies(results);
      setCurrenciesTimestamp(results.timestamp || new Date().toISOString());
      
      if (results.code === 0) {
        toast({
          title: "Currencies Fetched",
          description: `Successfully fetched ${Object.keys(results.data || {}).length} currencies!`,
        });
      } else {
        toast({
          title: "Failed to Fetch Currencies",
          description: results.msg || "Unknown error occurred",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Currencies fetch error:", error);
      setCurrenciesTimestamp(new Date().toISOString());
      toast({
        title: "API Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setCurrenciesLoading(false);
    }
  };

  const handleClearResults = () => {
    setTestResults(null);
    setCurrencies(null);
    setTestTimestamp(null);
    setCurrenciesTimestamp(null);
  };

  const handleCopyToClipboard = (text: string, label: string = "Content") => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Helper function to render status indicators
  const StatusIndicator = ({ success, children, pending = false, warning = false }) => {
    if (pending) return (
      <div className="flex items-center text-amber-500">
        <AlertTriangle className="h-4 w-4 mr-1" />
        <span>{children}</span>
      </div>
    );
    
    if (warning) return (
      <div className="flex items-center text-amber-500">
        <AlertCircle className="h-4 w-4 mr-1" />
        <span>{children}</span>
      </div>
    );
    
    return success ? (
      <div className="flex items-center text-green-500">
        <CheckCircle className="h-4 w-4 mr-1" />
        <span>{children}</span>
      </div>
    ) : (
      <div className="flex items-center text-red-500">
        <XCircle className="h-4 w-4 mr-1" />
        <span>{children}</span>
      </div>
    );
  };

  // Function to format JSON for display
  const formatJSON = (json: any) => {
    try {
      if (typeof json === 'string') {
        return JSON.stringify(JSON.parse(json), null, 2);
      }
      return JSON.stringify(json, null, 2);
    } catch (error) {
      return json;
    }
  };

  // Function to render a detailed section about signature generation
  const renderSignatureDetails = () => {
    if (!testResults?.signatureGeneration) return null;
    
    const { method, components } = testResults.signatureGeneration;
    
    return (
      <div className="mt-4 bg-gray-900/70 p-3 rounded">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-medium text-gray-300">Signature Generation Details</h5>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleSection('signatureDetails')}
            className="h-6 text-xs flex items-center"
          >
            {expandedSections.signatureDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        
        {expandedSections.signatureDetails && (
          <div className="text-xs text-gray-300 space-y-2">
            <div className="bg-black/30 p-2 rounded">
              <p className="font-medium mb-1">Signature Format:</p>
              <code className="text-green-400 block bg-black/50 p-1 rounded">{method}</code>
            </div>
            
            <div className="bg-black/30 p-2 rounded">
              <p className="font-medium mb-1">Components:</p>
              <div className="space-y-1 ml-2">
                <div><span className="text-blue-400">apiKey:</span> {components?.apiKey || 'Not provided'}</div>
                <div><span className="text-blue-400">timestamp:</span> {components?.timestamp || 'Not provided'}</div>
                <div><span className="text-blue-400">payload:</span> <code className="bg-black/50 p-1 rounded">{components?.payload || '{}'}</code></div>
              </div>
            </div>
            
            <div className="bg-black/30 p-2 rounded">
              <p className="font-medium mb-1">Signature Steps:</p>
              <ol className="list-decimal ml-4 space-y-1">
                <li>Concatenate: apiKey + timestamp + ":" + JSON.stringify(empty object or payload)</li>
                <li>Calculate HMAC-SHA256 of the concatenated string using API Secret as key</li>
                <li>Convert to hexadecimal format</li>
                <li>Pass in X-API-SIGN header</li>
              </ol>
            </div>
            
            <div className="bg-black/30 p-2 rounded">
              <p className="font-medium mb-1">Request Headers Required:</p>
              <ul className="list-disc ml-4 space-y-1">
                <li><span className="text-blue-400">X-API-KEY:</span> Your API key</li>
                <li><span className="text-blue-400">X-API-SIGN:</span> Generated signature</li>
                <li><span className="text-blue-400">X-API-TIME:</span> Unix timestamp in seconds</li>
                <li><span className="text-blue-400">Content-Type:</span> application/json</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to render HTTP request details
  const renderRequestDetails = (result: any) => {
    if (!result) return null;
    
    return (
      <div className="mb-4 border-b border-gray-700 pb-3">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-medium text-gray-400">HTTP Request Details:</h5>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleSection('requestDetails')}
            className="h-6 text-xs flex items-center"
          >
            {expandedSections.requestDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        
        {expandedSections.requestDetails && (
          <div className="text-xs text-gray-300 font-mono">
            <div className="mb-1">Method: <span className="text-blue-400">{result.method || "GET"}</span></div>
            <div className="mb-1 flex items-center justify-between">
              <div>URL: <span className="text-green-400">{testResults?.apiUrl || "N/A"}</span></div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-5 py-0 px-1" 
                onClick={() => handleCopyToClipboard(testResults?.apiUrl || "", "API URL")}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="mb-1">Headers:</div>
            <div className="pl-4 mb-2">
              {result?.headers && Object.entries(result.headers).map(([key, value]) => (
                <div key={key}>
                  <span className="text-blue-400">{key}</span>: {typeof value === 'string' ? value : JSON.stringify(value)}
                </div>
              ))}
            </div>
            <div className="mb-1">
              Timestamp: <span className="text-green-400">{testResults?.timestampSeconds ? 
                new Date(parseInt(testResults.timestampSeconds) * 1000).toLocaleString() : 
                'N/A'}
              </span>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Function to render response details
  const renderResponseDetails = (result: any) => {
    if (!result) return null;
    
    return (
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <h5 className="text-sm font-medium text-gray-400">Response Details:</h5>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => toggleSection('responseDetails')}
            className="h-6 text-xs flex items-center"
          >
            {expandedSections.responseDetails ? "Hide Details" : "Show Details"}
          </Button>
        </div>
        
        {expandedSections.responseDetails && (
          <div className="space-y-2">
            <div className={`p-2 rounded text-xs ${result.success ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
              <div className="font-medium mb-1">Status Code:</div>
              <div className={`font-mono ${result.success ? 'text-green-400' : 'text-red-400'}`}>
                {result.statusCode} {result.statusCode === 200 ? '(OK)' : 
                  result.statusCode === 401 ? '(Unauthorized)' : 
                  result.statusCode === 403 ? '(Forbidden)' : 
                  result.statusCode === 404 ? '(Not Found)' : 
                  result.statusCode === 500 ? '(Server Error)' : ''}
              </div>
            </div>
            
            {result.data && (
              <div className="bg-gray-900/50 p-2 rounded text-xs">
                <div className="font-medium mb-1 flex justify-between">
                  <span>Response Body:</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-5 py-0 px-1" 
                    onClick={() => handleCopyToClipboard(JSON.stringify(result.data, null, 2), "Response body")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
                <pre className="whitespace-pre-wrap bg-black/40 p-2 rounded overflow-x-auto text-gray-300">
                  {formatJSON(result.data)}
                </pre>
              </div>
            )}
            
            {result.data?.msg && (
              <div className={`p-2 rounded text-xs ${result.data.code === 0 ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                <div className="font-medium mb-1">API Message:</div>
                <div className={result.data.code === 0 ? 'text-green-400' : 'text-red-400'}>
                  {result.data.msg}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="mt-12">
      <Button 
        variant="outline" 
        onClick={() => setShowDebug(!showDebug)}
        className="mb-4"
      >
        {showDebug ? "Hide Debug Panel" : "Show Debug Panel"}
      </Button>
      
      {showDebug && (
        <Card className="mt-6 p-4 bg-black/50 rounded-lg text-left">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-200">FixedFloat API Tests</h3>
            
            {(testResults || currencies) && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClearResults}
                className="text-red-400 hover:text-red-300 hover:bg-red-900/20 border-red-800"
              >
                <Trash2 className="h-4 w-4 mr-1" /> Clear Results
              </Button>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <Button 
              onClick={handleTestAuth} 
              disabled={isLoading}
              className="flex-1"
              variant={testResults?.success ? "default" : "secondary"}
            >
              {isLoading ? "Testing Auth..." : "Test API Authentication"}
            </Button>
            
            <Button 
              onClick={handleTestCurrencies}
              disabled={currenciesLoading}
              className="flex-1"
              variant={currencies?.code === 0 ? "default" : "secondary"}
            >
              {currenciesLoading ? "Loading..." : "Test Fetch Currencies"}
            </Button>
          </div>
          
          {/* API Status Summary */}
          <div className="bg-gray-900/50 p-3 rounded mb-4">
            <h4 className="font-medium text-md mb-2 text-gray-300">API Status Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-900/70 p-2 rounded">
                <p className="text-sm text-gray-400 mb-1">Authentication Status:</p>
                <StatusIndicator 
                  success={testResults?.success} 
                  pending={isLoading}
                  warning={testResults === null}
                >
                  {isLoading ? "Testing..." : 
                   testResults === null ? "Not Tested" : 
                   testResults.success ? "Connected" : "Failed"}
                </StatusIndicator>
                {testResults && !testResults.success && testResults.message && (
                  <p className="text-xs text-red-400 mt-1">{testResults.message}</p>
                )}
              </div>
              
              <div className="bg-gray-900/70 p-2 rounded">
                <p className="text-sm text-gray-400 mb-1">Currencies Status:</p>
                <StatusIndicator 
                  success={currencies?.code === 0} 
                  pending={currenciesLoading}
                  warning={currencies === null}
                >
                  {currenciesLoading ? "Testing..." : 
                   currencies === null ? "Not Tested" : 
                   currencies.code === 0 ? "Available" : "Failed"}
                </StatusIndicator>
                {currencies && currencies.code !== 0 && currencies.msg && (
                  <p className="text-xs text-red-400 mt-1">{currencies.msg}</p>
                )}
              </div>
              
              <div className="bg-gray-900/70 p-2 rounded">
                <p className="text-sm text-gray-400 mb-1">API Base URL:</p>
                <p className="text-sm font-mono text-gray-300">
                  {testResults?.apiUrl?.replace(/\/ccies$/, '') || "https://fixedfloat.com/api/v2"}
                </p>
              </div>
              
              <div className="bg-gray-900/70 p-2 rounded">
                <p className="text-sm text-gray-400 mb-1">API Credentials:</p>
                <StatusIndicator 
                  success={testResults?.credentials?.apiKeyDefined && testResults?.credentials?.apiSecretDefined}
                  warning={testResults === null}
                >
                  {testResults === null ? "Not Checked" : 
                   (testResults?.credentials?.apiKeyDefined && testResults?.credentials?.apiSecretDefined) ? 
                   "Configured" : "Missing"}
                </StatusIndicator>
                {testResults?.credentials && (
                  <div className="text-xs mt-1">
                    <span className={testResults.credentials.apiKeyDefined ? "text-green-400" : "text-red-400"}>
                      {testResults.credentials.apiKeyDefined ? "✓" : "✗"} API Key
                    </span>
                    {" / "}
                    <span className={testResults.credentials.apiSecretDefined ? "text-green-400" : "text-red-400"}>
                      {testResults.credentials.apiSecretDefined ? "✓" : "✗"} API Secret
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Currently loaded currencies section */}
          <div className="mb-6">
            <h4 className="font-medium text-md mb-2 text-gray-300">
              Currently Loaded Currencies: {
                isLoadingCurrencies ? 
                <span className="text-amber-500">Loading...</span> : 
                <span className={availableCurrencies.length > 0 ? "text-green-500" : "text-red-500"}>
                  {availableCurrencies.length}
                </span>
              }
            </h4>
            {availableCurrencies.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {availableCurrencies.slice(0, 10).map((currency) => (
                  <Badge key={currency.symbol} variant="outline" className="py-1 px-2 flex items-center gap-1">
                    {currency.image && (
                      <img src={currency.image} alt={currency.name} className="w-4 h-4 rounded-full" />
                    )}
                    {currency.name || currency.symbol}
                  </Badge>
                ))}
                {availableCurrencies.length > 10 && (
                  <Badge variant="outline" className="py-1 px-2">
                    +{availableCurrencies.length - 10} more
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          {testResults && (
            <div className="mt-4">
              <h4 className="font-medium text-md mb-2 text-gray-300">
                Authentication Test: {testResults.success ? 
                  <span className="text-green-500">Success</span> : 
                  <span className="text-red-500">Failed</span>}
                {testTimestamp && (
                  <span className="text-xs ml-2 text-gray-400">
                    {new Date(testTimestamp).toLocaleString()}
                  </span>
                )}
              </h4>
              <div className="bg-gray-900 p-3 rounded">
                <div className="mb-2">
                  <span className="text-gray-400 text-sm">API URL: </span>
                  <span className="text-gray-300 text-sm font-mono">{testResults.apiUrl}</span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-400 text-sm">Endpoint: </span>
                  <span className="text-gray-300 text-sm font-mono">{testResults.endpoint}</span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-400 text-sm">Basic Connectivity: </span>
                  <span className={`text-sm font-mono ${testResults.basicConnectivityTest?.success ? 'text-green-500' : 'text-red-500'}`}>
                    {testResults.basicConnectivityTest?.success ? 'Connected' : 'Failed'} 
                    {testResults.basicConnectivityTest?.statusCode ? ` (Status: ${testResults.basicConnectivityTest.statusCode})` : ''}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-400 text-sm">API Credentials: </span>
                  <span className="text-gray-300 text-sm font-mono">
                    {testResults.credentials?.apiKeyDefined ? '✓ API Key Defined' : '✗ API Key Missing'}, 
                    {testResults.credentials?.apiSecretDefined ? '✓ API Secret Defined' : '✗ API Secret Missing'}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-400 text-sm">Timestamp: </span>
                  <span className="text-gray-300 text-sm font-mono">
                    {testResults.timestampSeconds ? new Date(parseInt(testResults.timestampSeconds) * 1000).toLocaleString() : 'N/A'}
                  </span>
                </div>
                <div className="mb-2">
                  <span className="text-gray-400 text-sm">Signature Generation: </span>
                  <span className="text-gray-300 text-sm font-mono">
                    {testResults.signatureGeneration?.method || "apiKey + timestamp + \":\" + requestData"}
                  </span>
                </div>
              </div>
              
              {/* Render signature details */}
              {renderSignatureDetails()}
              
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-400">API Test Results:</h5>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowRawRequest(!showRawRequest)}
                      className="h-6 text-xs flex items-center"
                    >
                      <Code className="h-3 w-3 mr-1" />
                      {showRawRequest ? "Hide Request Details" : "Show Request Details"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFullResponse(!showFullResponse)}
                      className="h-6 text-xs flex items-center"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      {showFullResponse ? "Hide Full Response" : "Show Full Response"}
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[400px] bg-gray-900 p-3 rounded">
                  {showRawRequest && testResults.results && testResults.results[0] && (
                    renderRequestDetails(testResults.results[0])
                  )}
                  
                  {testResults.results && testResults.results[0] && (
                    renderResponseDetails(testResults.results[0])
                  )}
                  
                  {showFullResponse ? (
                    <div>
                      <div className="flex justify-between mb-2">
                        <h6 className="text-sm font-medium text-gray-400">Full Response:</h6>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs flex items-center" 
                          onClick={() => handleCopyToClipboard(JSON.stringify(testResults, null, 2), "Full response")}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {formatJSON(testResults)}
                      </pre>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between mb-2">
                        <h6 className="text-sm font-medium text-gray-400">Test Results:</h6>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 text-xs flex items-center" 
                          onClick={() => handleCopyToClipboard(JSON.stringify(testResults.results, null, 2), "Test results")}
                        >
                          <Copy className="h-3 w-3 mr-1" /> Copy
                        </Button>
                      </div>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                        {formatJSON(testResults.results)}
                      </pre>
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
          
          {currencies && (
            <div className="mt-4">
              <h4 className="font-medium text-md mb-2 text-gray-300">
                Currencies Test: {currencies.code === 0 ? 
                  <span className="text-green-500">Success</span> : 
                  <span className="text-red-500">Failed</span>}
                {currenciesTimestamp && (
                  <span className="text-xs ml-2 text-gray-400">
                    {new Date(currenciesTimestamp).toLocaleString()}
                  </span>
                )}
              </h4>
              
              {currencies.code !== 0 && (
                <div className="bg-red-900/30 p-3 rounded mb-3">
                  <div className="font-medium text-red-400">Error:</div>
                  <div className="text-red-300 text-sm">{currencies.msg}</div>
                  {currencies.error && (
                    <div className="text-red-200 text-xs mt-1 font-mono">{currencies.error}</div>
                  )}
                </div>
              )}
              
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-sm font-medium text-gray-400">Fetched Data:</h5>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setShowFullResponse(!showFullResponse)}
                      className="h-6 text-xs flex items-center"
                    >
                      <Info className="h-3 w-3 mr-1" />
                      {showFullResponse ? "Hide Full Response" : "Show Full Response"}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-xs flex items-center" 
                      onClick={() => handleCopyToClipboard(JSON.stringify(currencies, null, 2), "Currencies data")}
                    >
                      <Copy className="h-3 w-3 mr-1" /> Copy
                    </Button>
                  </div>
                </div>
                
                <ScrollArea className="h-[300px] bg-gray-900 p-3 rounded">
                  {currencies.code === 0 && !showFullResponse ? (
                    <div>
                      <p className="text-sm font-medium text-green-400 mb-2">Successfully fetched {Object.keys(currencies.data || {}).length} currencies!</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {Object.entries(currencies.data || {}).slice(0, 20).map(([symbol, data]: [string, any]) => (
                          <div key={symbol} className="bg-gray-800/50 p-2 rounded text-xs">
                            <div className="font-medium text-blue-300">{symbol}</div>
                            <div>Name: {data.name}</div>
                            <div>Available: {data.available !== false ? "Yes" : "No"}</div>
                            {data.image && (
                              <div className="mt-1">
                                <img src={data.image} alt={data.name} className="h-4 w-4 inline-block mr-1 rounded-full" />
                                <span className="text-xs">Has image</span>
                              </div>
                            )}
                          </div>
                        ))}
                        {Object.keys(currencies.data || {}).length > 20 && (
                          <div className="text-gray-400 text-sm">
                            +{Object.keys(currencies.data || {}).length - 20} more currencies
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                      {formatJSON(currencies)}
                    </pre>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};
