from __future__ import annotations

from typing import Annotated, Any

from typing_extensions import TypedDict


def merge_messages(left: list[dict], right: list[dict]) -> list[dict]:
    return left + right


class AgentState(TypedDict):
    lead_id: str
    business_id: str
    conversation_id: str | None
    lead_data: dict[str, Any]
    business_data: dict[str, Any]
    conversation_history: list[dict[str, Any]]
    memory: list[dict[str, Any]]
    decision: str
    tool_output: dict[str, Any]
    messages: Annotated[list[dict[str, Any]], merge_messages]
    should_finish: bool
