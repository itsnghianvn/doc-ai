"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import {
  FileText,
  LayoutDashboard,
  MessageSquareText,
  Upload,
  X,
} from "lucide-react";

import {
  chatWithDocument,
  createConversation,
  deleteConversation,
  deleteDocument,
  getApiErrorMessage,
  getConversationMessages,
  getConversations,
  getDocuments,
  renameConversation,
  uploadDocument,
} from "@/lib/api";

import { ChatWindow } from "@/components/chat/chat-window";
import { DocumentDetailsPanel } from "@/components/dashboard/document-details-panel";
import { DocumentReadyDashboard } from "@/components/dashboard/document-ready-dashboard";
import { UploadDocument } from "@/components/document/upload-document";
import { ChatHistoryView } from "@/components/history/chat-history-view";
import { AppHeader } from "@/components/layout/app-header";
import { AppShell } from "@/components/layout/app-shell";
import {
  Sidebar,
  type SidebarSection,
} from "@/components/layout/sidebar";
import { SettingsView } from "@/components/settings/settings-view";
import { cn } from "@/lib/utils";
import {
  readUserPreferences,
  type UserPreferences,
} from "@/lib/user-preferences";

import type { Message, Source } from "@/types/chat";
import type {
  Conversation,
  ConversationWithDocument,
} from "@/types/conversation";
import type { Document } from "@/types/document";

type MobilePane = "document" | "chat";
type AppView = "dashboard" | "workspace";
const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;
const PdfViewer = dynamic(
  () =>
    import("@/components/document/pdf-viewer").then(
      (module) => module.PdfViewer
    ),
  { ssr: false }
);

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocument, setSelectedDocument] =
    useState<Document | null>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversations, setConversations] = useState<
    Conversation[]
  >([]);
  const [
    selectedConversation,
    setSelectedConversation,
  ] = useState<Conversation | null>(null);

  const [pdfPage, setPdfPage] = useState<number | null>(null);
  const [activeSource, setActiveSource] =
    useState<Source | null>(null);
  const [mobilePane, setMobilePane] =
    useState<MobilePane>("document");
  const [appView, setAppView] =
    useState<AppView>("dashboard");
  const [documentSearch, setDocumentSearch] = useState("");
  const [dashboardChatOpen, setDashboardChatOpen] =
    useState(false);
  const [activeSection, setActiveSection] =
    useState<SidebarSection>("documents");
  const [userPreferences, setUserPreferences] =
    useState<UserPreferences>(() => readUserPreferences());

  const [error, setError] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const dragDepthRef = useRef(0);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const selectedDocumentId =
    selectedDocument?.document_id;
  const hasProcessingDocuments = documents.some(
    (document) => document.status === "processing"
  );

  /*
   * Load documents
   */
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        const data = await getDocuments();

        setDocuments(data);

        if (data.length > 0) {
          setSelectedDocument(data[0]);
        }
      } catch (err) {
        console.error("Failed to load documents:", err);
        setError(
          getApiErrorMessage(
            err,
            "Failed to load documents."
          )
        );
      }
    };

    loadDocuments();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadConversationHistory = async () => {
      if (!selectedDocumentId) {
        setConversations([]);
        setSelectedConversation(null);
        setMessages([]);
        return;
      }

      try {
        const availableConversations =
          await getConversations(
            selectedDocumentId
          );

        if (cancelled) {
          return;
        }

        setConversations(availableConversations);

        const conversation =
          availableConversations[0] ?? null;
        setSelectedConversation(conversation);

        if (!conversation) {
          setMessages([]);
          return;
        }

        const storedMessages =
          await getConversationMessages(
            conversation.conversation_id
          );

        if (!cancelled) {
          setMessages(
            storedMessages.map((message) => ({
              role: message.role,
              content: message.content,
              sources: message.sources ?? undefined,
            }))
          );
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              err,
              "Failed to load conversation history."
            )
          );
        }
      }
    };

    loadConversationHistory();

    return () => {
      cancelled = true;
    };
  }, [selectedDocumentId]);

  useEffect(() => {
    if (
      !documents.some(
        (document) => document.status === "processing"
      )
    ) {
      return;
    }

    const interval = window.setInterval(async () => {
      try {
        const refreshedDocuments = await getDocuments();

        setDocuments(refreshedDocuments);
        setSelectedDocument((current) => {
          if (!current) {
            return current;
          }

          return (
            refreshedDocuments.find(
              (document) =>
                document.document_id === current.document_id
            ) ?? null
          );
        });

        const failedDocument = refreshedDocuments.find(
          (document) =>
            document.status === "failed" &&
            documents.some(
              (previous) =>
                previous.document_id === document.document_id &&
                previous.status === "processing"
            )
        );

        if (failedDocument) {
          setError(
            failedDocument.error_message ||
              `Failed to process ${failedDocument.filename}.`
          );
        }
      } catch (err) {
        setError(
          getApiErrorMessage(
            err,
            "Failed to refresh document status."
          )
        );
      }
    }, 2000);

    return () => window.clearInterval(interval);
  }, [documents]);

  /*
   * Auto scroll chat
   */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, chatLoading]);

  /*
   * Open file picker
   */
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const selectFile = (selectedFile: File) => {
    setError("");

    const hasPdfExtension =
      selectedFile.name.toLowerCase().endsWith(".pdf");
    const hasAllowedType =
      !selectedFile.type ||
      selectedFile.type === "application/pdf" ||
      selectedFile.type === "application/octet-stream";

    if (!hasPdfExtension || !hasAllowedType) {
      setError("Please select a valid PDF file.");
      return;
    }

    if (selectedFile.size > MAX_PDF_SIZE_BYTES) {
      setError("PDF files must be 20 MB or smaller.");
      return;
    }

    setFile(selectedFile);
  };

  /*
   * Select PDF
   */
  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const selectedFile =
      event.target.files?.[0] ?? null;

    event.target.value = "";

    if (!selectedFile) {
      return;
    }

    selectFile(selectedFile);
  };

  const handleDragEnter = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragDepthRef.current += 1;
    setDragActive(true);
  };

  const handleDragLeave = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragDepthRef.current -= 1;

    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setDragActive(false);
    }
  };

  const handleDrop = (
    event: React.DragEvent<HTMLDivElement>
  ) => {
    event.preventDefault();
    dragDepthRef.current = 0;
    setDragActive(false);

    const droppedFile = event.dataTransfer.files[0];
    if (droppedFile) {
      selectFile(droppedFile);
    }
  };

  /*
   * Upload document
   */
  const handleUpload = async () => {
    if (!file || loading) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await uploadDocument(file);

      setDocuments((prev) => [
        ...prev,
        data,
      ]);

      setSelectedDocument(data);
      setPdfPage(null);
      setActiveSource(null);
      setMobilePane("document");
      setAppView("dashboard");
      setDashboardChatOpen(false);
      setConversations([]);
      setSelectedConversation(null);

      setMessages([]);
      setQuestion("");

      setFile(null);
    } catch (err) {
      console.error("Upload error:", err);
      setError(
        getApiErrorMessage(
          err,
          "Upload failed. Please try again."
        )
      );
    } finally {
      setLoading(false);
    }
  };

  /*
   * Select document
   */
  const handleSelectDocument = (
    document: Document
  ) => {
    setActiveSection("documents");
    setSelectedDocument(document);
    setPdfPage(null);
    setActiveSource(null);
    setMobilePane("document");
    setAppView("dashboard");
    setDashboardChatOpen(false);
    setConversations([]);
    setSelectedConversation(null);

    setMessages([]);
    setQuestion("");
    setError("");
  };

  /*
   * Delete document
   */
  const handleDeleteDocument = async (
    documentId: string
  ) => {
    const document = documents.find(
      (item) => item.document_id === documentId
    );

    if (
      document &&
      !window.confirm(`Delete "${document.filename}"?`)
    ) {
      return;
    }

    try {
      setError("");

      await deleteDocument(documentId);

      const remainingDocuments =
        documents.filter(
          (document) =>
            document.document_id !== documentId
        );

      setDocuments(remainingDocuments);

      if (
        selectedDocument?.document_id ===
        documentId
      ) {
        const nextDocument =
          remainingDocuments[0] ?? null;

        setSelectedDocument(nextDocument);
        setPdfPage(null);
        setActiveSource(null);
        setConversations([]);
        setSelectedConversation(null);

        setMessages([]);
        setQuestion("");
        setAppView("dashboard");
        setDashboardChatOpen(false);
      }
    } catch (err) {
      console.error("Delete error:", err);

      setError(
        getApiErrorMessage(
          err,
          "Failed to delete document. Please try again."
        )
      );
    }
  };

  /*
   * Chat
   */
  const handleChat = async (questionOverride?: string) => {
    const userQuestion = (
      questionOverride ?? question
    ).trim();

    if (!userQuestion || chatLoading) {
      return;
    }

    if (!selectedDocument) {
      setError("Please select a document first.");
      return;
    }

    if (!selectedDocument.document_id) {
      setError(
        "Selected document is missing document ID."
      );
      return;
    }

    if (selectedDocument.status !== "ready") {
      setError(
        selectedDocument.status === "failed"
          ? selectedDocument.error_message ||
              "Document processing failed."
          : "Please wait until the document is ready."
      );
      return;
    }

    let optimisticMessageAdded = false;

    try {
      setDashboardChatOpen(true);
      setChatLoading(true);
      setError("");

      let activeConversation = selectedConversation;

      if (!activeConversation) {
        const createdConversation = await createConversation(
          selectedDocument.document_id
        );
        activeConversation = createdConversation;
        setConversations((prev) => [
          createdConversation,
          ...prev,
        ]);
        setSelectedConversation(activeConversation);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "user",
          content: userQuestion,
        },
      ]);
      optimisticMessageAdded = true;

      setQuestion("");

      const data = await chatWithDocument(
        userQuestion,
        selectedDocument.document_id,
        messages,
        activeConversation.conversation_id
      );

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.answer,
          sources: data.sources,
        },
      ]);

      if (activeConversation.title === "New conversation") {
        const updatedConversation = {
          ...activeConversation,
          title: userQuestion.slice(0, 120),
          updated_at: new Date().toISOString(),
        };

        setSelectedConversation(updatedConversation);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.conversation_id ===
            updatedConversation.conversation_id
              ? updatedConversation
              : conversation
          )
        );
      }
    } catch (err) {
      console.error("Chat error:", err);

      if (optimisticMessageAdded) {
        setMessages((current) => {
          const lastMessage = current[current.length - 1];

          if (
            lastMessage?.role === "user" &&
            lastMessage.content === userQuestion
          ) {
            return current.slice(0, -1);
          }

          return current;
        });
      }

      setError(
        getApiErrorMessage(
          err,
          "Failed to get an answer. Please try again."
        )
      );
    } finally {
      setChatLoading(false);
    }
  };

  const handleNewConversation = async () => {
    if (chatLoading) {
      return;
    }

    if (!selectedDocument) {
      setError("Please select a document first.");
      return;
    }

    try {
      const conversation = await createConversation(
        selectedDocument.document_id
      );

      setConversations((prev) => [
        conversation,
        ...prev,
      ]);
      setSelectedConversation(conversation);
      setMessages([]);
      setQuestion("");
      setError("");
      setDashboardChatOpen(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to create a conversation."
        )
      );
    }
  };

  const handleConversationChange = async (
    conversationId: string
  ) => {
    const conversation = conversations.find(
      (item) => item.conversation_id === conversationId
    );
    if (!conversation) {
      return;
    }

    try {
      const storedMessages =
        await getConversationMessages(conversationId);

      setSelectedConversation(conversation);
      setMessages(
        storedMessages.map((message) => ({
          role: message.role,
          content: message.content,
          sources: message.sources ?? undefined,
        }))
      );
      setQuestion("");
      setError("");
      setDashboardChatOpen(true);
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to load the conversation."
        )
      );
    }
  };

  const handleRenameConversation = async () => {
    if (!selectedConversation) {
      return;
    }

    const title = window.prompt(
      "Conversation name",
      selectedConversation.title
    )?.trim();

    if (!title || title === selectedConversation.title) {
      return;
    }

    try {
      const updated = await renameConversation(
        selectedConversation.conversation_id,
        title
      );

      setSelectedConversation(updated);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.conversation_id ===
          updated.conversation_id
            ? updated
            : conversation
        )
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to rename the conversation."
        )
      );
    }
  };

  const handleDeleteConversation = async () => {
    if (
      !selectedConversation ||
      !window.confirm(
        `Delete "${selectedConversation.title}"?`
      )
    ) {
      return;
    }

    try {
      await deleteConversation(
        selectedConversation.conversation_id
      );

      const remaining = conversations.filter(
        (conversation) =>
          conversation.conversation_id !==
          selectedConversation.conversation_id
      );
      const nextConversation = remaining[0] ?? null;

      setConversations(remaining);
      setSelectedConversation(nextConversation);
      setMessages([]);
      setQuestion("");

      if (nextConversation) {
        await handleConversationChange(
          nextConversation.conversation_id
        );
      }
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to delete the conversation."
        )
      );
    }
  };

  /*
   * Enter = send
   * Shift + Enter = newline
   */
  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      handleChat();
    }
  };

  /*
   * Open source in PDF
   */
  const handleSourceClick = (source: Source) => {
    if (
      !source.page_start ||
      source.document_id !== selectedDocument?.document_id
    ) {
      return;
    }

    setPdfPage(source.page_start);
    setActiveSource(source);

    if (userPreferences.openWorkspaceOnSource) {
      setMobilePane("document");
      setAppView("workspace");
    }
  };

  const openConversationFromHistory = async (
    entry: ConversationWithDocument
  ) => {
    const document = documents.find(
      (item) => item.document_id === entry.document_id
    );

    if (!document) {
      setError("This document is no longer available.");
      return;
    }

    setActiveSection("documents");
    setSelectedDocument(document);
    setPdfPage(null);
    setActiveSource(null);
    setAppView("dashboard");
    setDashboardChatOpen(true);
    setQuestion("");
    setError("");

    try {
      const [availableConversations, storedMessages] =
        await Promise.all([
          getConversations(entry.document_id),
          getConversationMessages(entry.conversation_id),
        ]);

      setConversations(availableConversations);
      setSelectedConversation(
        availableConversations.find(
          (conversation) =>
            conversation.conversation_id ===
            entry.conversation_id
        ) ?? entry
      );
      setMessages(
        storedMessages.map((message) => ({
          role: message.role,
          content: message.content,
          sources: message.sources ?? undefined,
        }))
      );
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "Failed to open the conversation."
        )
      );
    }
  };

  const handleDeleteConversationFromHistory = async (
    conversationId: string
  ) => {
    await deleteConversation(conversationId);

    if (
      selectedConversation?.conversation_id ===
      conversationId
    ) {
      const remaining = conversations.filter(
        (conversation) =>
          conversation.conversation_id !== conversationId
      );
      setConversations(remaining);
      setSelectedConversation(remaining[0] ?? null);
      setMessages([]);
      setQuestion("");
    }
  };

  const openWorkspace = (pane: MobilePane) => {
    setAppView("workspace");
    setMobilePane(pane);
  };

  const mobileTabClass = (active: boolean) =>
    cn(
      "flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition",
      active
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground"
    );

  return (
    <AppShell
      onDragEnter={handleDragEnter}
      onDragOver={(event) => event.preventDefault()}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileChange}
        className="hidden"
      />

      <Sidebar
        activeSection={activeSection}
        documents={documents}
        selectedDocument={selectedDocument}
        onSelectDocument={handleSelectDocument}
        onDeleteDocument={handleDeleteDocument}
        onUploadClick={handleUploadClick}
        search={documentSearch}
        onSearchChange={setDocumentSearch}
        onSectionChange={(section) => {
          setActiveSection(section);
          if (section === "documents") {
            setAppView("dashboard");
          }
        }}
      />

      <div className="flex min-w-0 flex-1">
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden">
          <AppHeader
            activeSection={activeSection}
            documents={documents}
            selectedDocument={selectedDocument}
            search={documentSearch}
            loading={loading}
            hasProcessingDocuments={hasProcessingDocuments}
            workspaceVisible={appView === "workspace"}
            onSearchChange={setDocumentSearch}
            onSelectDocument={handleSelectDocument}
            onUploadClick={handleUploadClick}
            onOpenDashboard={() => {
              setActiveSection("documents");
              setAppView("dashboard");
            }}
            onSectionChange={(section) => {
              setActiveSection(section);
              if (section === "documents") {
                setAppView("dashboard");
              }
            }}
          />

          {activeSection === "documents" && (
          <div className="grid grid-cols-3 border-b border-border bg-card p-1.5 md:hidden">
            <button
              type="button"
              onClick={() => setAppView("dashboard")}
              className={mobileTabClass(appView === "dashboard")}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => openWorkspace("document")}
              className={mobileTabClass(
                appView === "workspace" && mobilePane === "document"
              )}
            >
              <FileText size={14} />
              Document
            </button>
            <button
              type="button"
              onClick={() => openWorkspace("chat")}
              className={mobileTabClass(
                appView === "workspace" && mobilePane === "chat"
              )}
            >
              <MessageSquareText size={14} />
              Chat
            </button>
          </div>
          )}

          <div className="min-h-0 flex-1">
            {activeSection === "chat-history" ? (
              <ChatHistoryView
                onOpenConversation={(conversation) =>
                  void openConversationFromHistory(conversation)
                }
                onDeleteConversation={
                  handleDeleteConversationFromHistory
                }
              />
            ) : activeSection === "settings" ? (
              <SettingsView
                preferences={userPreferences}
                onPreferencesChange={setUserPreferences}
              />
            ) : appView === "dashboard" ? (
              dashboardChatOpen ? (
                <div className="h-full p-3 md:p-5">
                  <ChatWindow
                    messages={messages}
                    question={question}
                    chatLoading={chatLoading}
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    messagesEndRef={messagesEndRef}
                    onQuestionChange={setQuestion}
                    onChat={() => handleChat()}
                    onNewConversation={handleNewConversation}
                    onConversationChange={handleConversationChange}
                    onRenameConversation={handleRenameConversation}
                    onDeleteConversation={handleDeleteConversation}
                    onSuggestionClick={handleChat}
                    onKeyDown={handleKeyDown}
                    onSourceClick={handleSourceClick}
                  />
                </div>
              ) : (
                <DocumentReadyDashboard
                  document={selectedDocument}
                  question={question}
                  chatLoading={chatLoading}
                  onQuestionChange={setQuestion}
                  onChat={() => handleChat()}
                  onSuggestionClick={handleChat}
                  onKeyDown={handleKeyDown}
                  onUploadClick={handleUploadClick}
                />
              )
            ) : (
              <div className="grid h-full min-h-0 gap-4 p-3 md:grid-cols-2 md:p-5">
                <div
                  className={cn(
                    "min-h-0",
                    mobilePane === "document" ? "flex" : "hidden",
                    "md:flex"
                  )}
                >
                  <div className="min-h-0 min-w-0 flex-1">
                    <PdfViewer
                      key={
                        selectedDocument?.document_id ??
                        "no-document"
                      }
                      document={selectedDocument}
                      page={pdfPage}
                      source={activeSource}
                      onPageChange={(page) => {
                        setPdfPage(page);
                        setActiveSource(null);
                      }}
                    />
                  </div>
                </div>
                <div
                  className={cn(
                    "min-h-0",
                    mobilePane === "chat" ? "block" : "hidden",
                    "md:block",
                    (!selectedDocument ||
                      selectedDocument.status !== "ready") &&
                      "pointer-events-none opacity-50"
                  )}
                >
                  <ChatWindow
                    messages={messages}
                    question={question}
                    chatLoading={chatLoading}
                    conversations={conversations}
                    selectedConversation={selectedConversation}
                    messagesEndRef={messagesEndRef}
                    onQuestionChange={setQuestion}
                    onChat={() => handleChat()}
                    onNewConversation={handleNewConversation}
                    onConversationChange={handleConversationChange}
                    onRenameConversation={handleRenameConversation}
                    onDeleteConversation={handleDeleteConversation}
                    onSuggestionClick={handleChat}
                    onKeyDown={handleKeyDown}
                    onSourceClick={handleSourceClick}
                  />
                </div>
              </div>
            )}
          </div>
        </main>

        {appView === "dashboard" &&
          activeSection === "documents" && (
          <DocumentDetailsPanel
            document={selectedDocument}
            conversations={conversations}
            onNewConversation={handleNewConversation}
            onViewDocument={() => {
              setAppView("workspace");
              setMobilePane("document");
            }}
            onDeleteDocument={handleDeleteDocument}
            onSelectConversation={(conversation) =>
              handleConversationChange(
                conversation.conversation_id
              )
            }
          />
        )}
      </div>

      <UploadDocument
        file={file}
        loading={loading}
        onUpload={handleUpload}
        onCancel={() => setFile(null)}
      />

      {error && (
        <div
          role="alert"
          className="fixed right-4 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-destructive/20 bg-card px-4 py-3 shadow-lg"
        >
          <p className="min-w-0 flex-1 text-sm text-destructive">
            {error}
          </p>

          <button
            type="button"
            onClick={() => setError("")}
            className="shrink-0 rounded p-0.5 text-destructive/70 transition hover:bg-destructive/10 hover:text-destructive"
            aria-label="Dismiss error"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {dragActive && !loading && (
        <div className="pointer-events-none fixed inset-0 z-40 flex items-center justify-center bg-foreground/20 p-6 backdrop-blur-sm">
          <div className="rounded-2xl border-2 border-dashed border-primary/50 bg-card px-10 py-8 text-center shadow-xl">
            <Upload size={24} className="mx-auto text-primary" />
            <p className="mt-3 text-sm font-semibold">
              Drop your PDF here
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Maximum file size: 20 MB
            </p>
          </div>
        </div>
      )}
    </AppShell>
  );
}