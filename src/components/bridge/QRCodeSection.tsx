
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { invokeFunctionWithRetry } from "@/config/api";
import { toast } from "sonner";
import { DebugPanel } from "./DebugPanel";

interface QRCodeSectionProps {
  depositAddress?: string;
  depositAmount?: string;
  fromCurrency?: string;
  tag?: number | null;
  orderId?: string;
  token?: string;
}

export const QRCodeSection = ({
  depositAddress = "",
  depositAmount = "",
  fromCurrency = "",
  tag = null,
  orderId = "",
  token = "",
}: QRCodeSectionProps) => {
  const [qrTypes, setQrTypes] = useState<
    { title: string; src: string; checked: boolean }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Check if we have the necessary parameters
    if (!depositAddress || !orderId || !token) return;

    // Only fetch QR codes if the address is not in a loading state
    if (
      depositAddress === "Generating deposit address..." ||
      depositAddress === "Generating address..."
    )
      return;

    const fetchQrCodes = async () => {
      setLoading(true);
      setError(null);
      setDebugInfo(null);

      try {
        // Prepare request body for the QR code API
        const requestBody = {
          id: orderId,
          token: token,
          // Default to EXCHANGE option
          choice: "EXCHANGE",
        };

        console.log("Fetching QR codes with:", requestBody);

        // Store request details for debug
        const requestDetails = {
          url: "https://supabase-edge-function/bridge-qr",
          method: "POST",
          requestBody: requestBody,
          requestBodyString: JSON.stringify(requestBody)
        };

        // Build the cURL command for debugging
        const curlCommand = `curl -X POST "https://[your-supabase-project].functions.supabase.co/bridge-qr" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer [your-supabase-anon-key]" \\
  -d '${JSON.stringify(requestBody)}'`;

        // Call the bridge-qr Supabase function
        const startTime = Date.now();
        const response = await invokeFunctionWithRetry("bridge-qr", {
          body: requestBody,
        });
        const endTime = Date.now();

        console.log("QR code API response:", response);

        // Store response details for debug
        const responseDetails = {
          status: response?.code === 0 ? "200 OK" : "Error",
          statusText: response?.code === 0 ? "Success" : "Failed",
          body: JSON.stringify(response),
          responseTime: `${endTime - startTime}ms`,
        };

        // Construct debug info
        const newDebugInfo = {
          requestDetails,
          responseDetails,
          curlCommand,
        };

        setDebugInfo(newDebugInfo);

        if (response && response.code === 0 && response.data) {
          setQrTypes(response.data);
        } else {
          throw new Error(response?.msg || "Failed to fetch QR codes");
        }
      } catch (err) {
        console.error("Error fetching QR codes:", err);
        setError(err instanceof Error ? err.message : "Unknown error");

        // Update debug info with error
        if (debugInfo) {
          setDebugInfo({
            ...debugInfo,
            error: {
              message: err instanceof Error ? err.message : "Unknown error",
              stack: err instanceof Error ? err.stack : null,
            }
          });
        }

        // Fall back to the previous implementation if API fails
        fallbackToLocalQrGeneration();
      } finally {
        setLoading(false);
      }
    };

    // Fallback to local QR code generation if the API call fails
    const fallbackToLocalQrGeneration = () => {
      console.log("Falling back to local QR code generation");

      // Generate QR code with address only
      let addressQrData = depositAddress;
      if (tag && fromCurrency === "xrp") {
        addressQrData = `${depositAddress}?dt=${tag}`;
      }

      // Generate QR code with amount
      let amountQrData = depositAddress;
      if (fromCurrency === "btc") {
        amountQrData = `bitcoin:${depositAddress}?amount=${depositAmount}`;
      } else if (fromCurrency === "eth") {
        amountQrData = `ethereum:${depositAddress}?value=${depositAmount}`;
      } else if (fromCurrency === "xrp" && tag) {
        amountQrData = `${depositAddress}?amount=${depositAmount}&dt=${tag}`;
      } else {
        amountQrData = `${depositAddress}?amount=${depositAmount}`;
      }

      // Create QR code URLs
      const addressQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        addressQrData
      )}&size=200x200&margin=10`;

      const amountQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        amountQrData
      )}&size=200x200&margin=10`;

      // Set local QR codes
      setQrTypes([
        {
          title: "With amount",
          src: amountQrUrl,
          checked: true,
        },
        {
          title: "Address",
          src: addressQrUrl,
          checked: false,
        },
      ]);

      // Update debug info for fallback
      setDebugInfo(prev => ({
        ...prev,
        fallback: {
          method: "Local QR Generation",
          addressQrUrl,
          amountQrUrl,
          addressQrData,
          amountQrData
        }
      }));
    };

    // Fetch QR codes when component mounts or dependencies change
    fetchQrCodes();
  }, [depositAddress, depositAmount, fromCurrency, tag, orderId, token]);

  const handleQrTypeChange = (index: number) => {
    setQrTypes((prevTypes) =>
      prevTypes.map((type, i) => ({
        ...type,
        checked: i === index,
      }))
    );
  };

  const hasAddress =
    depositAddress && depositAddress !== "Generating deposit address...";

  const activeQrCode = qrTypes.find((type) => type.checked) || qrTypes[0];

  const toggleDebug = () => {
    if (debugInfo) {
      toast({
        title: "Debug Info",
        description: "Debug panel is displayed below the QR code section",
      });
    }
  };

  return (
    <div className="col-span-5 md:col-span-3 glass-card p-4 md:p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">Scan QR code</div>
        {hasAddress && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs"
            onClick={toggleDebug}
          >
            Debug
          </Button>
        )}
      </div>
      
      {loading ? (
        <div className="bg-white p-4 rounded-lg flex-col mb-4 w-full flex items-center justify-center">
          <div className="animate-pulse">
            <QrCode className="w-32 h-32 text-gray-300" />
          </div>
          <div className="text-xs text-center mt-2 text-black">
            Loading QR code...
          </div>
        </div>
      ) : hasAddress && qrTypes.length > 0 ? (
        <div className="bg-white p-4 rounded-lg flex-col mb-4 w-full flex items-center justify-center">
          <img src={activeQrCode?.src} alt="QR Code" className="w-32 h-32" />
          <div className="text-xs text-center mt-2 text-black">
            {activeQrCode?.title || "QR Code"}
          </div>
        </div>
      ) : (
        <div className="bg-white p-4 rounded-lg inline-block mb-4 opacity-50">
          <QrCode className="w-32 h-32 text-black" />
          <div className="text-xs text-center mt-2 text-black">
            {error ? "Failed to load QR code" : "Address not yet available"}
          </div>
        </div>
      )}
      <div className="flex gap-2">
        {qrTypes.map((type, index) => (
          <Button
            key={type.title}
            variant={type.checked ? "secondary" : "ghost"}
            size="sm"
            className="flex-1"
            onClick={() => handleQrTypeChange(index)}
            disabled={!hasAddress || loading}
          >
            {type.title}
          </Button>
        ))}
        {qrTypes.length === 0 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              disabled={true}
            >
              Address
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="flex-1"
              disabled={true}
            >
              With amount
            </Button>
          </>
        )}
      </div>
      
      {debugInfo && (
        <div className="mt-4">
          <DebugPanel debugInfo={debugInfo} isLoading={loading} />
        </div>
      )}
    </div>
  );
};
