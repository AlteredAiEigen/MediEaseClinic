import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  SearchIcon,
  SendIcon,
  MessageSquareIcon,
  Loader2Icon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BotIcon,
  UserIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchPatientsForWhatsApp,
  getPatientWhatsAppMessages,
  sendWhatsAppMessage,
  type WhatsAppPatient,
  type WhatsAppMessage,
} from "@/lib/api/whatsapp";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";

export function WhatsAppMessaging() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WhatsAppPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<WhatsAppPatient | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Search patients
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchPatientsForWhatsApp(searchQuery.trim(), 10);
      if (response.success && response.data) {
        setSearchResults(response.data.patients);
        if (response.data.patients.length === 0) {
          toast.info("No patients found");
        }
      } else {
        toast.error(response.message || "Failed to search patients");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to search patients");
    } finally {
      setIsSearching(false);
    }
  };

  // Select patient and load messages
  const handleSelectPatient = async (patient: WhatsAppPatient) => {
    setSelectedPatient(patient);
    setIsLoadingMessages(true);
    try {
      const response = await getPatientWhatsAppMessages(patient.patient_id, 100);
      if (response.success && response.data) {
        setMessages(response.data.messages);
      } else {
        toast.error(response.message || "Failed to load messages");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to load messages");
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Send message
  const handleSendMessage = async () => {
    if (!selectedPatient || !messageText.trim()) {
      toast.error("Please select a patient and enter a message");
      return;
    }

    if (!selectedPatient.whatsapp_phone) {
      toast.error("Patient phone number is invalid or missing country code");
      return;
    }

    if (!selectedPatient.consent_whatsapp) {
      toast.error("Patient has not consented to WhatsApp messages");
      return;
    }

    setIsSending(true);
    try {
      const response = await sendWhatsAppMessage({
        to: selectedPatient.whatsapp_phone,
        message: messageText.trim(),
        patient_id: selectedPatient.patient_id,
      });

      if (response.success && response.data) {
        toast.success("Message sent successfully");
        setMessageText("");
        
        // Add sent message to list immediately
        const newMessage: WhatsAppMessage = {
          message_sid: response.data.message_sid,
          direction: "outbound",
          body: messageText.trim(),
          status: response.data.status,
          received_at: response.data.timestamp,
          from: response.data.from_number,
          to: response.data.to,
          type: "manual",
        };
        setMessages((prev) => [newMessage, ...prev]);
        
        // Refresh messages after a short delay to get updated status
        setTimeout(() => {
          if (selectedPatient) {
            handleSelectPatient(selectedPatient);
          }
        }, 2000);
      } else {
        toast.error(response.message || "Failed to send message");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  // Format message time
  const formatMessageTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return format(date, "MMM d, h:mm a");
    } catch {
      return timestamp;
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === "delivered" || statusLower === "read" || statusLower === "sent") {
      return <Badge className="bg-green-500">Delivered</Badge>;
    } else if (statusLower === "failed" || statusLower === "undelivered") {
      return <Badge className="bg-red-500">Failed</Badge>;
    } else if (statusLower === "queued" || statusLower === "sending") {
      return <Badge className="bg-yellow-500">Sending</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-2"
        variant="outline"
      >
        <MessageSquareIcon className="h-4 w-4" />
        WhatsApp Messages
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>WhatsApp Messaging</DialogTitle>
            <DialogDescription>
              Send and receive WhatsApp messages with patients
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col gap-4 min-h-0">
            {/* Search Section */}
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, or phone number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                  className="pl-10"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2Icon className="h-4 w-4 animate-spin" />
                ) : (
                  <SearchIcon className="h-4 w-4" />
                )}
              </Button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Search Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-32">
                    <div className="space-y-2">
                      {searchResults.map((patient) => (
                        <div
                          key={patient.patient_id}
                          onClick={() => handleSelectPatient(patient)}
                          className={`p-3 rounded-lg border cursor-pointer hover:bg-accent ${
                            selectedPatient?.patient_id === patient.patient_id
                              ? "bg-accent border-primary"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{patient.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {patient.phone || "No phone"}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              {patient.consent_whatsapp ? (
                                <Badge className="bg-green-500">Consented</Badge>
                              ) : (
                                <Badge variant="destructive">No Consent</Badge>
                              )}
                              {!patient.whatsapp_phone && (
                                <Badge variant="outline">Invalid Phone</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Messages Section */}
            {selectedPatient && (
              <div className="flex-1 flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col min-h-0">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{selectedPatient.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {selectedPatient.phone}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (selectedPatient) {
                            handleSelectPatient(selectedPatient);
                          }
                        }}
                        disabled={isLoadingMessages}
                      >
                        {isLoadingMessages ? (
                          <Loader2Icon className="h-4 w-4 animate-spin" />
                        ) : (
                          "Refresh"
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col min-h-0">
                    <ScrollArea
                      ref={messagesContainerRef}
                      className="flex-1 pr-4"
                    >
                      {isLoadingMessages ? (
                        <div className="flex items-center justify-center h-32">
                          <Loader2Icon className="h-6 w-6 animate-spin" />
                        </div>
                      ) : messages.length === 0 ? (
                        <div className="flex items-center justify-center h-32 text-muted-foreground">
                          No messages yet
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {messages.map((message) => (
                            <div
                              key={message.message_sid}
                              className={`flex ${
                                message.direction === "outbound"
                                  ? "justify-end"
                                  : "justify-start"
                              }`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  message.direction === "outbound"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted"
                                }`}
                              >
                                <div className="flex items-start gap-2 mb-1">
                                  {message.type === "scheduler" ? (
                                    <BotIcon className="h-4 w-4 mt-0.5" />
                                  ) : message.direction === "inbound" ? (
                                    <UserIcon className="h-4 w-4 mt-0.5" />
                                  ) : null}
                                  <div className="flex-1">
                                    {message.type === "scheduler" && (
                                      <Badge
                                        variant="secondary"
                                        className="mb-1 text-xs"
                                      >
                                        Auto: {message.scenario?.replace("copy_", "").replace(/_/g, " ")}
                                      </Badge>
                                    )}
                                    <p className="text-sm whitespace-pre-wrap">
                                      {message.body}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-2 text-xs opacity-70">
                                  <span>{formatMessageTime(message.received_at)}</span>
                                  {message.direction === "outbound" && (
                                    <div className="flex items-center gap-1">
                                      {getStatusBadge(message.status)}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                          <div ref={messagesEndRef} />
                        </div>
                      )}
                    </ScrollArea>

                    {/* Send Message Input */}
                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Type your message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        rows={3}
                        disabled={isSending || !selectedPatient.consent_whatsapp || !selectedPatient.whatsapp_phone}
                      />
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {messageText.length}/1600 characters
                        </p>
                        <Button
                          onClick={handleSendMessage}
                          disabled={
                            isSending ||
                            !messageText.trim() ||
                            !selectedPatient.consent_whatsapp ||
                            !selectedPatient.whatsapp_phone
                          }
                        >
                          {isSending ? (
                            <>
                              <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <SendIcon className="h-4 w-4 mr-2" />
                              Send
                            </>
                          )}
                        </Button>
                      </div>
                      {!selectedPatient.consent_whatsapp && (
                        <p className="text-xs text-destructive">
                          Patient has not consented to WhatsApp messages
                        </p>
                      )}
                      {!selectedPatient.whatsapp_phone && (
                        <p className="text-xs text-destructive">
                          Patient phone number is invalid or missing country code
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

