import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { invokeFunctionWithRetry } from "@/config/api";
import { toast } from "sonner";

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

      try {
        // Prepare request body for the QR code API
        const requestBody = {
          id: orderId,
          token: token,
          // Default to EXCHANGE option
          choice: "EXCHANGE",
        };

        console.log("Fetching QR codes with:", requestBody);

        // Call the bridge-qr Supabase function
        const response = await invokeFunctionWithRetry("bridge-qr", {
          body: requestBody,
        });

        console.log("QR code API response:", response);

        if (response && response.code === 0 && response.data) {
          setQrTypes(response.data);
        } else {
          throw new Error(response?.msg || "Failed to fetch QR codes");
        }
      } catch (err) {
        console.error("Error fetching QR codes:", err);
        setError(err instanceof Error ? err.message : "Unknown error");

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

  return (
    <div className="col-span-5 md:col-span-3 glass-card p-6 rounded-xl">
      <div className="text-sm text-gray-400 mb-4">Scan QR code</div>
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
    </div>
  );
};
