"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Bot,
  Info,
  Link as LinkIcon,
  Loader2,
  MapPin,
  MessageSquare,
  Plus,
  Save,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createChatbotRuleId,
  getDefaultChatbotRules,
  getStoredChatbotRules,
  saveStoredChatbotRules,
  type ChatbotTrainingRule,
} from "@/lib/chatbot-training";
import { roomService } from "@/http/services/room.service";
import { userService } from "@/http/services/user.service";
import {
  RoomStatus,
  TenantType,
  type Room,
} from "@/types/room.types";
import { UserRole, type UserDetail } from "@/types/user.types";
import { formatPriceNPR } from "@/lib/utils";

type LessonFormState = {
  title: string;
  triggers: string;
  reply: string;
  actionLabel: string;
  actionHref: string;
};

type SuggestionFormState = {
  userId: string;
  city: string;
  maxBudget: string;
  womenOnly: string;
  tenantType: string;
  amenities: string;
  notes: string;
};

type Recommendation = {
  room: Room;
  score: number;
  reasons: string[];
};

const INITIAL_LESSON_FORM: LessonFormState = {
  title: "",
  triggers: "",
  reply: "",
  actionLabel: "",
  actionHref: "",
};

const INITIAL_SUGGESTION_FORM: SuggestionFormState = {
  userId: "",
  city: "",
  maxBudget: "",
  womenOnly: "all",
  tenantType: "any",
  amenities: "",
  notes: "",
};

function parseTriggers(value: string) {
  return value
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseKeywords(value: string) {
  return value
    .toLowerCase()
    .split(/\n|,|\s+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function includesText(source: string | undefined | null, value: string) {
  return (source || "").toLowerCase().includes(value.toLowerCase());
}

export default function AdminChatbotTrainingPage() {
  const [lessonForm, setLessonForm] = useState<LessonFormState>(
    INITIAL_LESSON_FORM,
  );
  const [suggestionForm, setSuggestionForm] = useState<SuggestionFormState>(
    INITIAL_SUGGESTION_FORM,
  );
  const [customRules, setCustomRules] = useState<ChatbotTrainingRule[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loadingStudio, setLoadingStudio] = useState(true);

  useEffect(() => {
    setCustomRules(getStoredChatbotRules());

    const loadStudioData = async () => {
      try {
        const [userResponse, roomResponse] = await Promise.all([
          userService.getUsers({ take: 100, role: UserRole.USER }),
          roomService.getRooms({
            take: 100,
            approvalStatus: RoomStatus.APPROVED,
            listingStatus: RoomStatus.AVAILABLE,
          }),
        ]);

        setUsers(userResponse.data ?? []);
        setRooms(roomResponse.data ?? []);
      } catch (error) {
        console.error("Failed to load chatbot studio data", error);
        toast.error("Could not load room or customer data for the AI studio.");
      } finally {
        setLoadingStudio(false);
      }
    };

    loadStudioData();
  }, []);

  const defaultTopics = useMemo(() => getDefaultChatbotRules().slice(0, 6), []);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === suggestionForm.userId) ?? null,
    [users, suggestionForm.userId],
  );

  const recommendations = useMemo<Recommendation[]>(() => {
    const city = suggestionForm.city.trim().toLowerCase();
    const maxBudget = Number(suggestionForm.maxBudget || 0);
    const amenityKeywords = parseKeywords(suggestionForm.amenities);
    const noteKeywords = parseKeywords(suggestionForm.notes);
    const tenantType =
      suggestionForm.tenantType !== "any"
        ? suggestionForm.tenantType
        : null;
    const womenOnly = suggestionForm.womenOnly === "yes";

    return rooms
      .map((room) => {
        let score = 0;
        const reasons: string[] = [];
        const roomCity = room.location?.city || room.location?.formattedAddress || room.address;
        const roomAmenities = (room.amenities || []).map((item) =>
          item.toLowerCase(),
        );

        if (city && includesText(roomCity, city)) {
          score += 4;
          reasons.push("City match");
        }

        if (maxBudget > 0) {
          const price = Number(room.price || 0);
          if (price <= maxBudget) {
            score += 4;
            reasons.push("Within budget");
          } else if (price <= maxBudget * 1.15) {
            score += 1;
            reasons.push("Near budget");
          }
        }

        if (womenOnly && room.allowsWomen) {
          score += 3;
          reasons.push("Women-friendly");
        }

        if (
          tenantType &&
          room.tenantTypes?.some(
            (item) => item.toLowerCase() === tenantType.toLowerCase(),
          )
        ) {
          score += 3;
          reasons.push("Tenant preference match");
        }

        amenityKeywords.forEach((keyword) => {
          if (roomAmenities.some((amenity) => amenity.includes(keyword))) {
            score += 1;
            reasons.push(`${keyword} available`);
          }
        });

        noteKeywords.forEach((keyword) => {
          if (
            includesText(room.title, keyword) ||
            includesText(room.description, keyword) ||
            includesText(room.category, keyword) ||
            roomAmenities.some((amenity) => amenity.includes(keyword))
          ) {
            score += 1;
            reasons.push(`Matches "${keyword}"`);
          }
        });

        return {
          room,
          score,
          reasons: Array.from(new Set(reasons)).slice(0, 4),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || Number(a.room.price) - Number(b.room.price))
      .slice(0, 6);
  }, [rooms, suggestionForm]);

  const handleLessonChange = (key: keyof LessonFormState, value: string) => {
    setLessonForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSuggestionChange = (
    key: keyof SuggestionFormState,
    value: string,
  ) => {
    setSuggestionForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleLessonSave = () => {
    const triggers = parseTriggers(lessonForm.triggers);

    if (!lessonForm.title.trim()) {
      toast.error("Please add a rule title.");
      return;
    }

    if (triggers.length === 0) {
      toast.error("Please add at least one trigger phrase.");
      return;
    }

    if (!lessonForm.reply.trim()) {
      toast.error("Please add the chatbot reply text.");
      return;
    }

    if (lessonForm.actionHref.trim() && !lessonForm.actionHref.trim().startsWith("/")) {
      toast.error("Action link must start with /");
      return;
    }

    const nextRule: ChatbotTrainingRule = {
      id: createChatbotRuleId(),
      title: lessonForm.title.trim(),
      triggers,
      reply: lessonForm.reply.trim(),
      actionLabel: lessonForm.actionLabel.trim() || undefined,
      actionHref: lessonForm.actionHref.trim() || undefined,
    };

    const nextRules = [nextRule, ...customRules];
    setCustomRules(nextRules);
    saveStoredChatbotRules(nextRules);
    setLessonForm(INITIAL_LESSON_FORM);
    toast.success("Chatbot rule saved.");
  };

  const handleDelete = (id: string) => {
    const nextRules = customRules.filter((rule) => rule.id !== id);
    setCustomRules(nextRules);
    saveStoredChatbotRules(nextRules);
    toast.success("Chatbot rule removed.");
  };

  const handleClearAll = () => {
    setCustomRules([]);
    saveStoredChatbotRules([]);
    toast.success("All custom chatbot rules cleared.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Bot className="h-6 w-6 text-red-500" />
            Chatbot & AI Suggestions
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Teach the assistant how to answer room questions and generate room
            suggestions from customer and room data.
          </p>
        </div>

        <Badge className="bg-amber-50 text-amber-700 border-amber-200 w-fit">
          Frontend storage only
        </Badge>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Info className="h-4 w-4" />
            Current limitation
          </CardTitle>
          <CardDescription className="text-amber-700">
            This repository currently has the frontend only. Chatbot lessons are
            stored in browser local storage, and the AI suggestion studio uses the
            room and customer data available to the admin dashboard right now.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <CardTitle>Add a chatbot lesson</CardTitle>
            <CardDescription>
              Add trigger phrases and the exact reply the bot should send.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Lesson title
              </label>
              <Input
                value={lessonForm.title}
                onChange={(e) => handleLessonChange("title", e.target.value)}
                placeholder="Example: Women-friendly rooms"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Trigger phrases
              </label>
              <Textarea
                value={lessonForm.triggers}
                onChange={(e) => handleLessonChange("triggers", e.target.value)}
                placeholder={"women room\nfemale room\nladies hostel"}
                className="min-h-24"
              />
              <p className="text-xs text-slate-500">
                Add one phrase per line, or separate them with commas.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Bot reply
              </label>
              <Textarea
                value={lessonForm.reply}
                onChange={(e) => handleLessonChange("reply", e.target.value)}
                placeholder="Tell the user how to find women-friendly rooms and what badge to look for."
                className="min-h-32"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Action button label
                </label>
                <Input
                  value={lessonForm.actionLabel}
                  onChange={(e) =>
                    handleLessonChange("actionLabel", e.target.value)
                  }
                  placeholder="Browse Rooms"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Action link
                </label>
                <Input
                  value={lessonForm.actionHref}
                  onChange={(e) => handleLessonChange("actionHref", e.target.value)}
                  placeholder="/rooms"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button onClick={handleLessonSave} className="cursor-pointer">
                <Save className="h-4 w-4" />
                Save Lesson
              </Button>
              <Button
                variant="outline"
                onClick={() => setLessonForm(INITIAL_LESSON_FORM)}
                className="cursor-pointer"
              >
                Reset Form
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Built-in topics</CardTitle>
              <CardDescription>
                These topics already work in the chatbot today.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {defaultTopics.map((rule) => (
                <div
                  key={rule.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{rule.title}</p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {rule.triggers.slice(0, 3).map((trigger) => (
                          <Badge
                            key={trigger}
                            variant="outline"
                            className="text-[11px] text-slate-600"
                          >
                            {trigger}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <MessageSquare className="h-4 w-4 text-red-500 shrink-0" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle>Custom lessons</CardTitle>
                  <CardDescription>
                    These are the extra answers taught from the admin panel.
                  </CardDescription>
                </div>
                {customRules.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleClearAll}
                    className="cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                    Clear All
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {customRules.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                  No custom lessons yet. Add one from the form to teach the bot.
                </div>
              ) : (
                customRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="rounded-xl border border-slate-200 p-4 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{rule.title}</p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {rule.triggers.map((trigger) => (
                            <Badge
                              key={trigger}
                              variant="outline"
                              className="text-[11px]"
                            >
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => handleDelete(rule.id)}
                        className="cursor-pointer text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <p className="text-sm text-slate-600 whitespace-pre-line">
                      {rule.reply}
                    </p>

                    {rule.actionLabel && rule.actionHref && (
                      <div className="inline-flex items-center gap-2 text-xs text-red-600 font-medium">
                        <LinkIcon className="h-3.5 w-3.5" />
                        {rule.actionLabel} → {rule.actionHref}
                      </div>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-red-500" />
            AI Suggestion Studio
          </CardTitle>
          <CardDescription>
            Use customer information, room data, and preference notes to suggest the
            best matching rooms from the admin panel.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loadingStudio ? (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 p-4 text-sm text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin text-red-500" />
              Loading customers and rooms for the suggestion studio...
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Customer
                  </label>
                  <Select
                    value={suggestionForm.userId}
                    onValueChange={(value) =>
                      handleSuggestionChange("userId", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name} · {user.phone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Preferred city / area
                  </label>
                  <Input
                    value={suggestionForm.city}
                    onChange={(e) => handleSuggestionChange("city", e.target.value)}
                    placeholder="Pokhara, Lakeside..."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Max budget
                  </label>
                  <Input
                    type="number"
                    value={suggestionForm.maxBudget}
                    onChange={(e) =>
                      handleSuggestionChange("maxBudget", e.target.value)
                    }
                    placeholder="15000"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Women-friendly only
                  </label>
                  <Select
                    value={suggestionForm.womenOnly}
                    onValueChange={(value) =>
                      handleSuggestionChange("womenOnly", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All rooms</SelectItem>
                      <SelectItem value="yes">Only women-friendly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Tenant type
                  </label>
                  <Select
                    value={suggestionForm.tenantType}
                    onValueChange={(value) =>
                      handleSuggestionChange("tenantType", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any</SelectItem>
                      {Object.values(TenantType).map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">
                    Must-have amenities
                  </label>
                  <Input
                    value={suggestionForm.amenities}
                    onChange={(e) =>
                      handleSuggestionChange("amenities", e.target.value)
                    }
                    placeholder="wifi, parking, kitchen"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Customer interests / notes
                </label>
                <Textarea
                  value={suggestionForm.notes}
                  onChange={(e) => handleSuggestionChange("notes", e.target.value)}
                  placeholder="Example: student, quiet area, attached bathroom, near college"
                  className="min-h-24"
                />
              </div>

              {selectedUser && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center">
                    <UserRound className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900">{selectedUser.name}</p>
                    <p className="text-sm text-slate-500">
                      {selectedUser.email} · {selectedUser.phone}
                    </p>
                  </div>
                  {selectedUser.isVerified && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200">
                      Verified customer
                    </Badge>
                  )}
                </div>
              )}

              <div className="grid gap-4">
                {recommendations.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
                    Add customer preferences above to generate room suggestions.
                  </div>
                ) : (
                  recommendations.map(({ room, score, reasons }) => (
                    <div
                      key={room.id}
                      className="rounded-2xl border border-slate-200 p-4 lg:p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="space-y-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-semibold text-slate-900">
                              {room.title}
                            </h3>
                            <Badge className="bg-red-50 text-red-700 border-red-200">
                              Match score {Math.round(score)}
                            </Badge>
                            {room.allowsWomen && (
                              <Badge
                                variant="outline"
                                className="text-pink-700 border-pink-200"
                              >
                                Women OK
                              </Badge>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-sm text-slate-500">
                            <span>{formatPriceNPR(Number(room.price))}/month</span>
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="h-4 w-4 text-red-400" />
                              {room.location?.city || room.address}
                            </span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            {reasons.map((reason) => (
                              <Badge
                                key={reason}
                                variant="outline"
                                className="bg-slate-50"
                              >
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        <Button asChild className="cursor-pointer">
                          <Link href={`/admin/dashboard/rooms/${room.id}`}>
                            Open Room
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-4 w-4 text-red-500" />
            Good lesson ideas
          </CardTitle>
          <CardDescription>
            Helpful topics for this bot are usually room-specific and action-oriented.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-3">
          {[
            "How to find cheap rooms in Pokhara",
            "How to identify women-friendly rooms",
            "What users should know before unlocking owner contact",
          ].map((idea) => (
            <div
              key={idea}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700"
            >
              {idea}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
