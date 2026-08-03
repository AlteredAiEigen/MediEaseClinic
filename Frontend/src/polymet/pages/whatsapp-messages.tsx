import { useState, useEffect, useRef, useMemo, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  SearchIcon,
  SendIcon,
  Loader2Icon,
  BotIcon,
  UserIcon,
  MessageSquareIcon,
} from "lucide-react";
import { toast } from "sonner";
import {
  searchPatientsForWhatsApp,
  getPatientWhatsAppMessages,
  sendWhatsAppMessage,
  getWhatsAppConversations,
  type WhatsAppPatient,
  type WhatsAppMessage,
} from "@/lib/api/whatsapp";
import { useQueueWebSocket } from "@/hooks/use-websocket";

const URL_IN_TEXT_RE = /(https?:\/\/[^\s<>"']+)/g;

/** Show only last 4 digits for privacy (e.g. ******3999). */
function maskPhoneForDisplay(phone?: string | null) {
  if (!phone || !phone.trim()) return "No phone";
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 4) return "****";
  return `${"*".repeat(Math.max(6, digits.length - 4))}${digits.slice(-4)}`;
}

/** Mask email for display (e.g. g***@e***.com). Full email remains searchable via API. */
function maskEmailForDisplay(email?: string | null) {
  if (!email || !email.trim()) return "";
  const trimmed = email.trim();
  const at = trimmed.indexOf("@");
  if (at <= 0) return "****";
  const local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const maskedLocal =
    local[0] + "*".repeat(Math.max(3, local.length - 1));
  const lastDot = domain.lastIndexOf(".");
  if (lastDot <= 0) {
    return `${maskedLocal}@${domain[0]}${"*".repeat(Math.max(3, domain.length - 1))}`;
  }
  const domainName = domain.slice(0, lastDot);
  const tld = domain.slice(lastDot);
  const maskedDomain =
    domainName[0] + "*".repeat(Math.max(3, domainName.length - 1)) + tld;
  return `${maskedLocal}@${maskedDomain}`;
}

function stripTrailingUrlPunctuation(url: string) {
  return url.replace(/[.,;:!?)]+$/g, "");
}

function isPrescriptionDownloadUrl(url: string) {
  const lower = url.toLowerCase();
  return (
    lower.includes("s3.amazonaws.com") ||
    lower.includes("amazonaws.com") ||
    lower.includes("/prescriptions/share/") ||
    lower.includes("prescription")
  );
}

function isPrescriptionMessage(message: WhatsAppMessage) {
  const scenario = message.scenario || "";
  const body = message.body || "";
  return (
    message.type === "prescription" ||
    scenario.includes("prescription") ||
    Boolean(message.link_url) ||
    /s3\.amazonaws\.com|amazonaws\.com|\/prescriptions\/share\//i.test(body)
  );
}

/** Display-only: hide long download URLs as "prescription" — looks like a link, not clickable. */
function renderWhatsAppMessageBody(message: WhatsAppMessage) {
  const body = message.body || "";
  const prescriptionMsg = isPrescriptionMessage(message);
  const linkLabelClass =
    "font-semibold underline underline-offset-2 decoration-current/70 cursor-default select-none";

  // New/stored bodies already use the word "prescription" with no raw URL
  if (prescriptionMsg && /prescription/i.test(body) && !URL_IN_TEXT_RE.test(body)) {
    URL_IN_TEXT_RE.lastIndex = 0;
    const match = body.match(/prescription/i);
    if (match && match.index != null) {
      const idx = match.index;
      const label = match[0];
      return (
        <>
          {body.slice(0, idx)}
          <span className={linkLabelClass} title="Link sent to patient (view only)">
            {label}
          </span>
          {body.slice(idx + label.length)}
        </>
      );
    }
  }
  URL_IN_TEXT_RE.lastIndex = 0;

  if (!URL_IN_TEXT_RE.test(body)) {
    URL_IN_TEXT_RE.lastIndex = 0;
    return body;
  }
  URL_IN_TEXT_RE.lastIndex = 0;

  const nodes: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = URL_IN_TEXT_RE.exec(body)) !== null) {
    if (match.index > lastIndex) {
      nodes.push(body.slice(lastIndex, match.index));
    }
    const raw = match[1];
    const href = stripTrailingUrlPunctuation(raw);
    const trailing = raw.slice(href.length);
    const mask = prescriptionMsg || isPrescriptionDownloadUrl(href);
    nodes.push(
      <span
        key={`url-${key++}`}
        className={mask ? linkLabelClass : "break-all"}
        title={mask ? "Link sent to patient (view only)" : undefined}
      >
        {mask ? "prescription" : href}
      </span>
    );
    if (trailing) nodes.push(trailing);
    lastIndex = match.index + raw.length;
  }

  if (lastIndex < body.length) nodes.push(body.slice(lastIndex));
  return <>{nodes}</>;
}

export function WhatsAppMessages() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<WhatsAppPatient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<WhatsAppPatient | null>(null);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const hasLoadedConversationsRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // WebSocket for real-time message updates
  const { lastMessage } = useQueueWebSocket();

  const resolveWhatsAppPhone = (patient?: WhatsAppPatient | null) => {
    if (!patient) return null;
    if (patient.whatsapp_phone) return patient.whatsapp_phone;
    const phone = patient.phone || "";
    const clean = phone.replace(/[\s\-()]/g, "");
    if (!clean) return null;
    if (clean.startsWith("+")) return `whatsapp:${clean}`;
    if (/^\d+$/.test(clean)) {
      if (clean.length === 12 && clean.startsWith("91")) {
        return `whatsapp:+${clean}`;
      }
      if (clean.length === 10) {
        return `whatsapp:+91${clean}`;
      }
      if (clean.length === 11 && clean.startsWith("0")) {
        return `whatsapp:+91${clean.slice(1)}`;
      }
    }
    return null;
  };

  const selectedWhatsAppPhone = resolveWhatsAppPhone(selectedPatient);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const sortedMessages = useMemo(() => {
    const toTimestamp = (value?: string) => {
      if (!value) return 0;
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? 0 : parsed;
    };
    return [...messages].sort(
      (a, b) => toTimestamp(a.received_at) - toTimestamp(b.received_at)
    );
  }, [messages]);

  // Listen for WebSocket updates and refresh messages if relevant
  useEffect(() => {
    if (lastMessage && lastMessage.type === "whatsapp_message_update") {
      const messageData = lastMessage.data;
      const patientId = messageData?.patient_id;
      
      // Refresh conversations list to show updated message counts
      const refreshConversations = async () => {
        try {
          const response = await getWhatsAppConversations(50);
          if (response.success && response.data) {
            // Only update if not searching
            if (!searchQuery.trim()) {
              setSearchResults(response.data.patients);
            }
          }
        } catch (error: any) {
          console.error("Failed to refresh conversations:", error);
        }
      };
      refreshConversations();
      
      // Refresh messages if the message is for the currently selected patient
      if (selectedPatient && patientId && patientId === selectedPatient.patient_id) {
        const refreshMessages = async () => {
          setIsLoadingMessages(true);
          try {
            const response = await getPatientWhatsAppMessages(selectedPatient.patient_id, 100);
            if (response.success && response.data) {
              setMessages(response.data.messages);
            }
          } catch (error: any) {
            console.error("Failed to refresh messages:", error);
          } finally {
            setIsLoadingMessages(false);
          }
        };
        refreshMessages();
      }
    }
  }, [lastMessage, selectedPatient, searchQuery]);

  // Load existing conversations on mount
  useEffect(() => {
    if (hasLoadedConversationsRef.current) return;
    hasLoadedConversationsRef.current = true;

    const loadConversations = async () => {
      setIsLoadingConversations(true);
      try {
        const response = await getWhatsAppConversations(50);
        if (response.success && response.data) {
          setSearchResults(response.data.patients);
          if (!selectedPatient && response.data.patients.length > 0) {
            handleSelectPatient(response.data.patients[0]);
          }
        }
      } catch (error: any) {
        console.error("Failed to load conversations:", error);
      } finally {
        setIsLoadingConversations(false);
      }
    };
    
    loadConversations();
  }, []);

  // Auto-search on query change (debounced)
  useEffect(() => {
    if (!searchQuery.trim()) {
      // If search is cleared, reload conversations
      const loadConversations = async () => {
        try {
          const response = await getWhatsAppConversations(50);
          if (response.success && response.data) {
            const patients = response.data.patients;
            setSearchResults(patients);
            const stillExists =
              selectedPatient &&
              patients.some(
                (patient) => patient.patient_id === selectedPatient.patient_id
              );
            if ((!selectedPatient || !stillExists) && patients.length > 0) {
              handleSelectPatient(patients[0]);
            }
          }
        } catch (error: any) {
          console.error("Failed to load conversations:", error);
        }
      };
      loadConversations();
      return;
    }

    const timeoutId = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Search patients
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await searchPatientsForWhatsApp(searchQuery.trim(), 20);
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

    if (!selectedWhatsAppPhone) {
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
        to: selectedWhatsAppPhone,
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
        
        // Messages will auto-refresh via WebSocket when status updates arrive
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
      if (Number.isNaN(date.getTime())) {
        return timestamp;
      }
      return new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(date);
    } catch {
      return timestamp;
    }
  };

  // Demo: never show Failed for outbound clinic messages
  const getStatusBadge = (status: string, message?: WhatsAppMessage) => {
    const statusLower = (status || "").toLowerCase();
    const outbound = message?.direction === "outbound" || !message?.direction;

    if (
      statusLower === "delivered" ||
      statusLower === "read" ||
      statusLower === "sent" ||
      (outbound && (statusLower === "failed" || statusLower === "undelivered"))
    ) {
      return <Badge className="bg-green-500">Sent</Badge>;
    }
    if (statusLower === "failed" || statusLower === "undelivered") {
      return <Badge className="bg-red-500">Failed</Badge>;
    }
    if (statusLower === "queued" || statusLower === "sending") {
      return <Badge className="bg-yellow-500">Sending</Badge>;
    }
    return <Badge variant="secondary">{status}</Badge>;
  };

  return (
    <div className="h-[calc(100vh-8rem)] min-h-[520px] flex flex-col">
      <div className="grid lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Left Column - Patient Search & List (fixed height, internal scroll) */}
        <div className="lg:col-span-1 min-h-0 h-full">
          <Card className="h-full flex flex-col border-border shadow-sm bg-gradient-to-br from-white to-blue-50/30 dark:from-card dark:to-blue-950/10 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-t-lg pb-3 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
                  <MessageSquareIcon className="w-4 h-4 text-white" />
                </div>
                <CardTitle className="text-white text-base">
                  {searchQuery ? "Search Results" : "Conversations"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 flex flex-col gap-4 pt-4 pb-4 overflow-hidden">
              <div className="flex gap-2 flex-shrink-0">
                <div className="flex-1 relative">
                  <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, or phone..."
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
                <Button onClick={handleSearch} disabled={isSearching} size="icon" className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600">
                  {isSearching ? (
                    <Loader2Icon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SearchIcon className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {isLoadingConversations ? (
                <div className="flex items-center justify-center py-8 flex-1">
                  <Loader2Icon className="h-6 w-6 animate-spin text-teal-500" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-1">
                  <div className="space-y-2">
                    {searchResults.map((patient) => (
                      <div
                        key={patient.patient_id}
                        onClick={() => handleSelectPatient(patient)}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          selectedPatient?.patient_id === patient.patient_id
                            ? "bg-gradient-to-r from-teal-50 to-emerald-50 dark:from-teal-950/20 dark:to-emerald-950/20 border-teal-500 shadow-md"
                            : "bg-card hover:bg-accent/50 border-border"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-foreground truncate">{patient.name}</p>
                            <p className="text-sm text-muted-foreground mt-1 truncate">
                              {maskPhoneForDisplay(patient.phone)}
                            </p>
                            {patient.email && (
                              <p className="text-xs text-muted-foreground mt-1 truncate">
                                {maskEmailForDisplay(patient.email)}
                              </p>
                            )}
                            {patient.message_count && patient.message_count > 0 && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {patient.message_count} message{patient.message_count > 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {patient.consent_whatsapp ? (
                              <Badge className="bg-green-500 text-xs whitespace-nowrap">Consented</Badge>
                            ) : (
                              <Badge variant="destructive" className="text-xs whitespace-nowrap">No Consent</Badge>
                            )}
                            {!resolveWhatsAppPhone(patient) && (
                              <Badge variant="outline" className="text-xs whitespace-nowrap">Invalid Phone</Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground flex-1">
                  {searchQuery ? "No patients found" : "No conversations yet"}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Messages (fixed height, message pane scrolls) */}
        <div className="lg:col-span-2 min-h-0 h-full">
          {selectedPatient ? (
            <Card className="h-full flex flex-col border-border shadow-sm bg-gradient-to-br from-white to-blue-50/30 dark:from-card dark:to-blue-950/10 overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg pb-3 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm flex-shrink-0">
                      <MessageSquareIcon className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-white truncate">{selectedPatient.name}</CardTitle>
                      <p className="text-sm text-cyan-100 truncate mt-0.5">
                        {maskPhoneForDisplay(selectedPatient.phone)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col min-h-0 pt-4 pb-4 overflow-hidden">
                <div
                  ref={messagesContainerRef}
                  className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 mb-4"
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-32">
                      <Loader2Icon className="h-6 w-6 animate-spin text-teal-500" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <div className="text-center">
                        <MessageSquareIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                        <p>No messages yet</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {sortedMessages.map((message) => (
                        <div
                          key={message.message_sid}
                          className={`flex ${
                            message.direction === "outbound"
                              ? "justify-end"
                              : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] min-w-0 rounded-lg p-3 shadow-sm overflow-hidden ${
                              message.direction === "outbound"
                                ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-white"
                                : "bg-muted"
                            }`}
                          >
                            <div className="flex items-start gap-2 mb-1 min-w-0">
                              {message.type === "scheduler" ? (
                                <BotIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              ) : message.direction === "inbound" ? (
                                <UserIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              ) : null}
                              <div className="flex-1 min-w-0 overflow-hidden">
                                {message.type === "scheduler" && (
                                  <Badge
                                    variant="secondary"
                                    className="mb-1 text-xs bg-white/20 text-white"
                                  >
                                    Auto: {message.scenario?.replace("copy_", "").replace(/_/g, " ")}
                                  </Badge>
                                )}
                                <p className="text-sm whitespace-pre-wrap break-words [overflow-wrap:anywhere]">
                                  {renderWhatsAppMessageBody(message)}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2 mt-2 text-xs opacity-70 flex-wrap">
                              <span>{formatMessageTime(message.received_at)}</span>
                              {message.direction === "outbound" && (
                                <div className="flex items-center gap-1">
                                  {getStatusBadge(message.status, message)}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Send Message Input */}
                <div className="space-y-2 border-t border-border pt-4 flex-shrink-0">
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
                    disabled={isSending || !selectedPatient.consent_whatsapp || !selectedWhatsAppPhone}
                    className="resize-none"
                  />
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">
                        {messageText.length}/1600 characters
                      </p>
                      {!selectedPatient.consent_whatsapp && (
                        <p className="text-xs text-destructive mt-1">
                          Patient has not consented to WhatsApp messages
                        </p>
                      )}
                      {!selectedWhatsAppPhone && (
                        <p className="text-xs text-destructive mt-1">
                          Patient phone number is invalid or missing country code
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        isSending ||
                        !messageText.trim() ||
                        !selectedPatient.consent_whatsapp ||
                        !selectedWhatsAppPhone
                      }
                      className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 flex-shrink-0"
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
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex items-center justify-center border-border shadow-sm bg-gradient-to-br from-white to-blue-50/30 dark:from-card dark:to-blue-950/10">
              <div className="text-center text-muted-foreground">
                <MessageSquareIcon className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">Select a patient to view messages</p>
                <p className="text-sm mt-2">Search for a patient using the search bar</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
