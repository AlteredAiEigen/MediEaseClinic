import { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, SendIcon, PaperclipIcon, AlertCircleIcon, Loader2 } from "lucide-react";
import { get, post } from "@/lib/api-client";

interface Patient {
  _id: string;
  patientId: string;
  fullName: string;
  age: string;
  gender: string;
  phone: string;
  email?: string;
}

interface Message {
  _id: string;
  content: string;
  senderId: string;
  senderRole: "doctor" | "patient" | "admin" | "receptionist";
  timestamp: string;
  read: boolean;
}

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessagesDialog({ open, onOpenChange }: MessagesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoadingPatients, setIsLoadingPatients] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch patients when dialog opens
  useEffect(() => {
    if (open) {
      const fetchPatients = async () => {
        try {
          setIsLoadingPatients(true);
          setError(null);

          const response = await get<{ data: Patient[] }>("/api/patients?limit=100");
          if (response.success && response.data?.data) {
            setPatients(response.data.data);
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : "Failed to load patients";
          setError(message);
        } finally {
          setIsLoadingPatients(false);
        }
      };

      fetchPatients();
    } else {
      // Reset form when dialog closes
      setSelectedPatient(null);
      setMessages([]);
      setMessageText("");
      setSearchQuery("");
      setError(null);
    }
  }, [open]);

  // Fetch messages when patient is selected
  useEffect(() => {
    if (selectedPatient) {
      const fetchMessages = async () => {
        try {
          setIsLoadingMessages(true);

          const response = await get<{ messages: Message[] }>(`/api/messages/patient/${selectedPatient._id}`);
          if (response.success && response.data?.messages) {
            setMessages(response.data.messages);
          } else {
            setMessages([]);
          }
        } catch (err) {
          console.error("Failed to load messages:", err);
          setMessages([]);
        } finally {
          setIsLoadingMessages(false);
        }
      };

      fetchMessages();
    } else {
      setMessages([]);
    }
  }, [selectedPatient]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return patients.slice(0, 10); // Show first 10 if no search

    const query = searchQuery.toLowerCase();
    return patients.filter(
      (patient) =>
        patient.fullName.toLowerCase().includes(query) ||
        patient.patientId.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
    );
  }, [patients, searchQuery]);

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedPatient) return;

    setIsSending(true);
    setError(null);

    try {
      const messageData = {
        patientId: selectedPatient._id,
        content: messageText,
        messageType: "text",
      };

      const response = await post<{ message: Message }>("/api/messages", messageData);

      if (response.success && response.data?.message) {
        setMessages((prev) => [...prev, response.data!.message]);
        setMessageText("");
      } else {
        setError(response.message ?? "Failed to send message");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to send message";
      setError(message);
    } finally {
      setIsSending(false);
    }
  };

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setMessages([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Messages</DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 flex-1 overflow-hidden">
          {/* Left Side - Patient Search */}
          <div className="flex-1 flex flex-col min-w-0 border-r border-border pr-6">
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">
                Search Patient
              </Label>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />

                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
              {isLoadingPatients ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading patients...</span>
                </div>
              ) : filteredPatients.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <SearchIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No patients found</p>
                </div>
              ) : (
                filteredPatients.map((patient) => (
                  <div
                    key={patient._id}
                    onClick={() => handleSelectPatient(patient)}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedPatient?._id === patient._id
                        ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
                        : "border-border hover:bg-accent"
                    }`}
                  >
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                        {patient.fullName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {patient.fullName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {patient.patientId} • Age {patient.age}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="w-96 flex flex-col">
            {error && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 mb-4">
                <div className="flex items-center gap-2">
                  <AlertCircleIcon className="w-4 h-4 text-red-500" />
                  <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                </div>
              </div>
            )}

            {selectedPatient ? (
              <>
                <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-gradient-to-br from-cyan-400 to-blue-500 text-white">
                        {selectedPatient.fullName.split(" ").map(n => n[0]).join("")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedPatient.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPatient.patientId}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading messages...</span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <SendIcon className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">No messages yet</p>
                    </div>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message._id}
                        className={`flex ${message.senderRole === "doctor" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            message.senderRole === "doctor"
                              ? "bg-cyan-600 text-white"
                              : "bg-muted text-foreground"
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                          <p
                            className={`text-[10px] mt-1 ${
                              message.senderRole === "doctor"
                                ? "text-cyan-100"
                                : "text-muted-foreground"
                            }`}
                          >
                            {new Date(message.timestamp).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex gap-2">
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
                      rows={2}
                      className="resize-none"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <PaperclipIcon className="w-4 h-4 mr-2" />
                      Attach
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!messageText.trim() || isSending}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <SendIcon className="w-4 h-4 mr-2" />
                          Send
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center">
                <div>
                  <SendIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />

                  <p className="text-sm text-muted-foreground">
                    Select a patient to start messaging
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
