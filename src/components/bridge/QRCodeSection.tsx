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
    if (!depositAddress || !orderId || !token) return;

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
        const requestBody = {
          id: orderId,
          token: token,
          choice: "EXCHANGE",
        };

        console.log("Fetching QR codes with:", requestBody);

        const requestDetails = {
          url: "https://supabase-edge-function/bridge-qr",
          method: "POST",
          requestBody: requestBody,
          requestBodyString: JSON.stringify(requestBody),
        };

        const curlCommand = `curl -X POST "https://loqpepftcimqjkiinuwv.functions.supabase.co/bridge-qr" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvcXBlcGZ0Y2ltcWpraWludXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg3OTMxNjEsImV4cCI6MjA1NDM2OTE2MX0.R8z0PZx01OoNUEx-CA3yWmFHiI1gSXKKTNpA7D1_zYo" \\
  -d '${JSON.stringify(requestBody)}'`;

        const startTime = Date.now();
        const response = await invokeFunctionWithRetry("bridge-qr", {
          body: requestBody,
        });
        const endTime = Date.now();

        console.log("QR code API response:", response);

        const responseDetails = {
          status: response?.code === 0 ? "200 OK" : "Error",
          statusText: response?.code === 0 ? "Success" : "Failed",
          body: JSON.stringify(response),
          responseTime: `${endTime - startTime}ms`,
        };

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

        if (debugInfo) {
          setDebugInfo({
            ...debugInfo,
            error: {
              message: err instanceof Error ? err.message : "Unknown error",
              stack: err instanceof Error ? err.stack : null,
            },
          });
        }

        fallbackToLocalQrGeneration();
      } finally {
        setLoading(false);
      }
    };

    const fallbackToLocalQrGeneration = () => {
      console.log("Falling back to local QR code generation");

      let addressQrData = depositAddress;
      if (tag && fromCurrency === "xrp") {
        addressQrData = `${depositAddress}?dt=${tag}`;
      }

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

      const addressQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        addressQrData
      )}&size=200x200&margin=10`;

      const amountQrUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
        amountQrData
      )}&size=200x200&margin=10`;

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

      setDebugInfo((prev) => ({
        ...prev,
        fallback: {
          method: "Local QR Generation",
          addressQrUrl,
          amountQrUrl,
          addressQrData,
          amountQrData,
        },
      }));
    };

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
      toast("Debug panel is displayed below the QR code section", {
        className: "bg-[#0FA0CE] text-white font-medium",
      });
    }
  };

  return (
    <div className="col-span-5 md:col-span-3 glass-card p-4 md:p-6 rounded-xl">
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-gray-400">Scan QR code</div>
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
