import { useState } from "react";
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
import { SearchIcon, SendIcon, PaperclipIcon } from "lucide-react";
import { patients } from "@/polymet/data/healthcare-data";

interface Message {
  id: string;
  text: string;
  sender: "doctor" | "patient";
  timestamp: string;
}

interface MessagesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessagesDialog({ open, onOpenChange }: MessagesDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [messageText, setMessageText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const filteredPatients = patients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendMessage = () => {
    if (messageText.trim() && selectedPatient) {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: messageText,
        sender: "doctor",
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };
      setMessages([...messages, newMessage]);
      setMessageText("");
    }
  };

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    // Mock previous messages
    setMessages([
      {
        id: "1",
        text: "Hello Doctor, I wanted to follow up on my last appointment.",
        sender: "patient",
        timestamp: "10:30 AM",
      },
      {
        id: "2",
        text: "Hi! Of course. How are you feeling today?",
        sender: "doctor",
        timestamp: "10:32 AM",
      },
      {
        id: "3",
        text: "Much better, thank you. The medication is working well.",
        sender: "patient",
        timestamp: "10:35 AM",
      },
    ]);
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
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  onClick={() => handleSelectPatient(patient)}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedPatient?.id === patient.id
                      ? "border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20"
                      : "border-border hover:bg-accent"
                  }`}
                >
                  <Avatar className="w-10 h-10">
                    <AvatarImage
                      src={`https://github.com/${patient.id}.png`}
                      alt={patient.name}
                    />

                    <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">
                      {patient.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {patient.id} • Age {patient.age}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Side - Chat Interface */}
          <div className="w-96 flex flex-col">
            {selectedPatient ? (
              <>
                <div className="p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage
                        src={`https://github.com/${selectedPatient.id}.png`}
                        alt={selectedPatient.name}
                      />

                      <AvatarFallback>
                        {selectedPatient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{selectedPatient.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedPatient.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender === "doctor" ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          message.sender === "doctor"
                            ? "bg-cyan-600 text-white"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-[10px] mt-1 ${
                            message.sender === "doctor"
                              ? "text-cyan-100"
                              : "text-muted-foreground"
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
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
                      disabled={!messageText.trim()}
                      className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white"
                    >
                      <SendIcon className="w-4 h-4 mr-2" />
                      Send
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
