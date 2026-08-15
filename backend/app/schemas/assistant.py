"""Pydantic schemas for AI Executive Assistant."""

from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


class AssistantQueryRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000, description="Natural language user command")
    context: Optional[Dict[str, Any]] = Field(default=None, description="Optional UI context payload")


class AssistantAction(BaseModel):
    action_type: str  # e.g. "create_task", "create_note", "schedule_event", "query_info"
    label: str
    payload: Dict[str, Any]


class AssistantQueryResponse(BaseModel):
    summary: str
    intent_detected: str
    executed_action: Optional[AssistantAction] = None
    suggested_followups: List[str] = Field(default_factory=list)


class DailyBriefingRead(BaseModel):
    date_str: str
    greeting: str
    pending_tasks_count: int
    upcoming_events_count: int
    overdue_reminders_count: int
    unread_notifications_count: int
    executive_summary: str
    focus_recommendation: str
