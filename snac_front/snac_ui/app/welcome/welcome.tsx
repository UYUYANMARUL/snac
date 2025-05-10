import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSignMessage } from "wagmi";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ArrowUpRight, Plus, Copy, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  createDepositAddress,
  getDepositAddress,
  getUtxos,
} from "@/hooks/contract";
import {
  useAppKitAccount,
  useAppKitNetworkCore,
  useAppKitProvider,
} from "@reown/appkit/react";
import { keccak256, type Address } from "viem";
import { useEthersSigner } from "@/hooks/useSigner";
import { getBytes, toUtf8Bytes } from "ethers";

// Types
type UTXO = {
  id: string;
  contract_address: string;
  amount: string;
};

type DepositAddress = {
  hash: string;
  address: string;
};

// Utility function to shorten addresses
const shortenAddress = (address: string) => {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(
    address.length - 4
  )}`;
};

export function ChangeUtxoDialog({ isOpen }: { isOpen: boolean }) {
  return (
    <Dialog open={isOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit Profile</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input id="name" value="Pedro Duarte" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value="@peduarte" className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit">Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function UtxoSection({
  utxos,
  handleUtxoClick,
}: {
  utxos: any;
  handleUtxoClick: (utxo: any) => void;
}) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-medium">Matching Contract Addresses</h3>
        <Badge variant="outline" className="bg-primary/10 text-primary">
          {utxos.length} UTXOs
        </Badge>
      </div>
      <div className="space-y-3 max-h-[420px]">
        {utxos.length > 0 ? (
          utxos.map((utxo: any) => (
            <div
              key={utxo.id}
              className="bg-secondary p-3 rounded-md cursor-pointer transition-all hover:bg-primary/10 border-l-4 border-primary"
              onClick={() => handleUtxoClick(utxo)}
            >
              <div className="flex-1">
                <div className="text-sm font-medium">
                  {shortenAddress(utxo.contract_address)}
                </div>
                <div className="text-lg font-bold">{utxo.amount}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center p-4 text-muted-foreground">
            No matching UTXOs available
          </div>
        )}
      </div>
    </div>
  );
}

export function UtxoList() {}

export function sendTokenOut() {}

export function sendTokenIn() {}
export function DepositAddressList({
  depositAddresses,
}: {
  depositAddresses: DepositAddress[];
}) {
  return (
    <Card className="shadow-lg md:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle>Deposit Addresses</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {depositAddresses.map((address) => (
            <div key={address.hash} className="bg-secondary p-3 rounded-md">
              <div className="text-sm font-medium truncate">
                {address.hash}
                {shortenAddress(address.hash)}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="mt-2 w-full flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Address
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MainCard() {
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAppKitAccount();
  const { chainId } = useAppKitNetworkCore();
  const [vault, setVault] = useState<{
    key: `0x${string}`;
    isActive: boolean;
  }>();
  const signer = useEthersSigner({ chainId: Number(chainId) });

  const { data: depositAddresses = [] } = useQuery({
    queryKey: ["depositHashes", vault],
    queryFn: async () => {
      const depositAddresses: string[] = await getDepositAddress(vault?.key);
      return depositAddresses.map((hash) => {
        return { hash: hash, address: "" } as DepositAddress;
      });
    },
  });

  const { data: allUtxos = [] } = useQuery({
    queryKey: ["utxos"],
    queryFn: async () => {
      // return getUtxos(data) as UTXO[];
      return [
        {
          id: "utxo1",
          contract_address: "0x1234567890abcdef1234567890abcdef12345678",
          amount: "0.5",
        },
        {
          id: "utxo2",
          contract_address: "0x1234567890abcdef1234567890abcdef12345678",
          amount: "1.2",
        },
        {
          id: "utxo3",
          contract_address: "0xabcdef1234567890abcdef1234567890abcdef12",
          amount: "0.75",
        },
        {
          id: "utxo4",
          contract_address: "0x1234567890abcdef1234567890abcdef12345678",
          amount: "2.3",
        },
        {
          id: "utxo5",
          contract_address: "0xfedcba9876543210fedcba9876543210fedcba98",
          amount: "0.3",
        },
        {
          id: "utxo6",
          contract_address: "0xabcdef1234567890abcdef1234567890abcdef12",
          amount: "1.5",
        },
        {
          id: "utxo7",
          contract_address: "0xfedcba9876543210fedcba9876543210fedcba98",
          amount: "0.8",
        },
      ] as UTXO[];
    },
    initialData: [],
  });

  useEffect(() => {
    console.log(depositAddresses);
  }, [depositAddresses]);

  async function handleCreateDepositAddress() {
    console.log();
    console.log(vault?.key);
    if (!signer) {
      return;
    }
    if (vault?.key == null) {
      return;
    }
    const depositAddress = (
      "000000" + Math.floor(Math.random() * 1000000)
    ).slice(-6);

    await createDepositAddress(signer, depositAddress, vault?.key);
  }

  async function unlockVault() {
    const msg = "vault";
    const sig = await signMessageAsync({
      message: msg,
      account: address as Address,
    });
    const vaultKey = keccak256(sig);

    setVault({
      key: vaultKey,
      isActive: true,
    });
  }

  // State for the UTXO slots - one UTXO per slot (shared between send out and send in)
  const [slots, setSlots] = useState<(UTXO | null)[]>([null, null, null]);

  // Track the order of UTXOs added to slots (for FIFO replacement)
  const [slotsOrder, setSlotsOrder] = useState<string[]>([]);

  const [selectedContractAddress, setSelectedContractAddress] =
    useState<string>("");

  // State for available UTXOs (those not in slots)
  const [availableUtxos, setAvailableUtxos] = useState<UTXO[]>([]);

  // State for selected slot
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  // State for active tab in the middle section
  const [activeTab, setActiveTab] = useState<
    "createAddress" | "sendToken" | "sendToDepositAddress"
  >("sendToken");

  // State for send mode (true = send out, false = send in)
  const [isSendOut, setIsSendOut] = useState(true);

  // Form states
  const [sendForm, setSendForm] = useState({
    ethereumAddress: "", // For send out
    hash1: "", // For send in
    hash2: "", // For both
    amount: "", // For both
  });

  const [createAddressForm, setCreateAddressForm] = useState({
    label: "",
  });

  // Update available UTXOs whenever allUtxos or slots change
  useEffect(() => {
    if (!allUtxos) return;

    // Get all UTXOs that are in slots
    const usedUtxoIds = new Set<string>();

    slots.forEach((utxo) => {
      if (utxo) usedUtxoIds.add(utxo.id);
    });

    // Filter out UTXOs that are already in slots, but maintain original order
    const available = allUtxos.filter((utxo) => !usedUtxoIds.has(utxo.id));

    // Only update if the available UTXOs have actually changed
    if (
      available.length !== availableUtxos.length ||
      available.some((utxo, i) => availableUtxos[i]?.id !== utxo.id)
    ) {
      setAvailableUtxos(available);
    }
  }, [allUtxos, slots]);

  // Get the contract addresses currently in slots
  const getSlotContractAddresses = () => {
    const addresses = new Set<string>();
    slots.forEach((slot) => {
      if (slot) {
        addresses.add(slot.contract_address);
      }
    });
    return addresses;
  };

  // Split available UTXOs into matching and non-matching based on contract addresses in slots
  const getMatchingAndNonMatchingUtxos = () => {
    const slotAddresses = getSlotContractAddresses();

    // If no slots are filled, all UTXOs are non-matching
    if (slotAddresses.size === 0) {
      return {
        matching: [],
        nonMatching: availableUtxos,
      };
    }

    const matching = availableUtxos.filter((utxo) =>
      slotAddresses.has(utxo.contract_address)
    );
    const nonMatching = availableUtxos.filter(
      (utxo) => !slotAddresses.has(utxo.contract_address)
    );

    return {
      matching,
      nonMatching,
    };
  };

  // Calculate total spendable amount for slots
  const calculateTotalSpendable = () => {
    return slots
      .filter((slot): slot is UTXO => slot !== null)
      .reduce((sum, utxo) => sum + Number.parseFloat(utxo.amount), 0)
      .toFixed(2);
  };

  // Handle removing a UTXO from a slot
  const removeFromSlot = (index: number) => {
    const utxoId = slots[index]?.id;
    if (utxoId) {
      setSlotsOrder((prev) => prev.filter((id) => id !== utxoId));
    }

    const newSlots = [...slots];
    newSlots[index] = null;
    setSlots(newSlots);

    // Clear selected slot if it was the one we just removed from
    if (selectedSlot === index) {
      setSelectedSlot(null);
    }
  };

  // Handle clicking on a slot to select it
  const handleSlotClick = (index: number) => {
    if (selectedSlot === index) {
      // If clicking the already selected slot, deselect it
      setSelectedSlot(null);
    } else {
      // Otherwise, select this slot
      setSelectedSlot(index);
    }
  };

  // Handle clicking on a UTXO in the balances list
  const handleUtxoClick = (utxo: UTXO) => {
    // If a slot is selected, swap the UTXO with that slot
    if (selectedSlot !== null) {
      const index = selectedSlot;
      const newSlots = [...slots];

      // If the slot already has a UTXO, remove it from the order
      if (newSlots[index]) {
        setSlotsOrder((prev) =>
          prev.filter((id) => id !== newSlots[index]!.id)
        );
      }

      newSlots[index] = utxo;
      setSlots(newSlots);

      // Add to order if not already there
      if (!slotsOrder.includes(utxo.id)) {
        setSlotsOrder((prev) => [...prev, utxo.id]);
      }

      // Clear the selection after swapping
      setSelectedSlot(null);
    } else {
      // Find the first empty slot
      const emptySlotIndex = slots.findIndex((slot) => slot === null);

      if (emptySlotIndex !== -1) {
        // If there's an empty slot, use it
        const newSlots = [...slots];
        newSlots[emptySlotIndex] = utxo;
        setSlots(newSlots);
        setSlotsOrder((prev) => [...prev, utxo.id]);
      } else {
        // If all slots are full, replace the oldest one (FIFO)
        const oldestUtxoId = slotsOrder[0];
        const oldestSlotIndex = slots.findIndex(
          (slot) => slot?.id === oldestUtxoId
        );

        if (oldestSlotIndex !== -1) {
          const newSlots = [...slots];
          newSlots[oldestSlotIndex] = utxo;
          setSlots(newSlots);

          // Update the order (remove oldest, add new)
          setSlotsOrder((prev) => [...prev.slice(1), utxo.id]);
        }
      }
    }
  };

  // Handle toggling between send out and send in modes
  const handleSendModeToggle = (checked: boolean) => {
    setIsSendOut(checked);
  };

  // Get the split UTXOs
  const { matching, nonMatching } = getMatchingAndNonMatchingUtxos();

  return (
    <main className="container mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Section - UTXO Balances (Split into two parts) */}
        <Card className="h-[600px] overflow-y-auto shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="flex justify-between items-center">
              <span>UTXO Balances</span>
              <Badge variant="outline">{availableUtxos.length} Available</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            {/* Matching UTXOs Section */}
            <UtxoSection utxos={matching} handleUtxoClick={handleUtxoClick} />

            <Separator className="my-4" />

            {/* Non-Matching UTXOs Section */}
            <UtxoSection
              utxos={nonMatching}
              handleUtxoClick={handleUtxoClick}
            />
          </CardContent>
        </Card>

        {/* Right Section - Tabs with UTXO Slots and Send Token Form */}
        <Card className="h-[600px] overflow-y-auto shadow-lg">
          <CardContent className="p-4">
            <Tabs
              defaultValue="sendToken"
              className="w-full"
              onValueChange={(value) =>
                setActiveTab(
                  value as
                    | "createAddress"
                    | "sendToken"
                    | "sendToDepositAddress"
                )
              }
            >
              <TabsList className="grid grid-cols-3 mb-4 w-full">
                <TabsTrigger
                  value="createAddress"
                  className="cursor-pointer flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" /> Create Address
                </TabsTrigger>
                <TabsTrigger
                  value="sendToken"
                  className="cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Send Token
                </TabsTrigger>
                <TabsTrigger
                  value="sendToDepositAddress"
                  className="hover:cursor-pointer flex items-center gap-1"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Send Normal
                </TabsTrigger>
              </TabsList>

              {/* Create Address Tab */}
              <TabsContent value="createAddress" className="space-y-4">
                <h3 className="text-lg font-semibold">Create New Address</h3>
                <Button onClick={handleCreateDepositAddress} className="w-full">
                  Create Address
                </Button>
              </TabsContent>

              {/* Send Token Tab (Combined Send Out and Send In) */}
              <TabsContent value="sendToken" className="space-y-4">
                {/* UTXO Slots Section */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">UTXO Slots</h3>
                    <Badge
                      variant="outline"
                      className="bg-primary/10 text-primary"
                    >
                      {calculateTotalSpendable()}
                    </Badge>
                  </div>
                  <div className="text-xs text-muted-foreground mb-2">
                    {selectedSlot !== null
                      ? "Click a UTXO to place in selected slot"
                      : "Click a slot to select it, or click a UTXO to place in next available slot"}
                  </div>
                  <div className="grid grid-cols-3 gap-2 bg-secondary/30 p-2 rounded-md">
                    {slots.map((slot, index) => (
                      <div
                        key={`slot-${index}`}
                        className={`h-24 border-2 ${
                          selectedSlot === index
                            ? "border-solid border-primary ring-2 ring-primary"
                            : slot
                            ? "border-solid border-primary/50"
                            : "border-dashed border-gray-300"
                        } rounded-md p-2 flex flex-col items-center justify-center transition-all hover:bg-secondary/50 cursor-pointer`}
                        onClick={() => handleSlotClick(index)}
                      >
                        {slot ? (
                          <div className="w-full h-full relative">
                            <button
                              className="absolute top-1 right-1 text-xs bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeFromSlot(index);
                              }}
                            >
                              <X className="w-3 h-3" />
                            </button>
                            <div className="text-xs truncate font-medium">
                              {shortenAddress(slot.contract_address)}
                            </div>
                            <div className="text-sm font-bold mt-2">
                              {slot.amount}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Slot {index + 1}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm text-center">
                            Slot {index + 1}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Separator className="my-4" />

                {/* Send Token Form */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {isSendOut ? "Send Token Out" : "Send Token In"}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between space-x-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="send-mode"
                        checked={isSendOut}
                        onCheckedChange={handleSendModeToggle}
                      />
                      <Label htmlFor="send-mode" className="cursor-pointer">
                        {isSendOut ? "Send Out Mode" : "Send In Mode"}
                      </Label>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {isSendOut ? (
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Send outside Snac
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3" /> Send inside Snac
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Dynamic fields based on mode */}
                  {isSendOut ? (
                    <div className="space-y-2">
                      <Label htmlFor="ethereumAddress">Ethereum Address</Label>
                      <Input
                        id="ethereumAddress"
                        placeholder="0x..."
                        value={sendForm.ethereumAddress}
                        onChange={(e) =>
                          setSendForm({
                            ...sendForm,
                            ethereumAddress: e.target.value,
                          })
                        }
                      />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="hash1">Hash 1</Label>
                      <Input
                        id="hash1"
                        placeholder="Enter hash 1"
                        value={sendForm.hash1}
                        onChange={(e) =>
                          setSendForm({ ...sendForm, hash1: e.target.value })
                        }
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="hash2">Hash 2</Label>
                    <Input
                      id="hash2"
                      placeholder="Enter hash 2"
                      value={sendForm.hash2}
                      onChange={(e) =>
                        setSendForm({ ...sendForm, hash2: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      placeholder="0.0"
                      value={sendForm.amount}
                      onChange={(e) =>
                        setSendForm({ ...sendForm, amount: e.target.value })
                      }
                    />
                  </div>

                  <Button
                    className="w-full"
                    onClick={async () => {
                      await getDepositAddress();
                    }}
                  >
                    {isSendOut ? "Send Out" : "Send In"}
                  </Button>
                </div>

                {/* Create Address Tab */}
                <TabsContent value="sendToDepositAddress" className="space-y-4">
                  <h3 className="text-lg font-semibold">Create New Address</h3>
                  <Button className="w-full">Create Address</Button>
                </TabsContent>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <DepositAddressList depositAddresses={depositAddresses} />
      </div>
      <div className="w-full flex justify-center items-center">
        {!vault?.isActive ? (
          <Button onClick={unlockVault} className="w-xl mt-4">
            Unlock Vault
          </Button>
        ) : null}
      </div>
    </main>
  );
}
