import logging
import os
from typing import Annotated, Any, Sequence

from langchain_core.messages import AIMessage, BaseMessage, HumanMessage, SystemMessage
from langgraph.graph import END, StateGraph

from .state import AgentState, merge_messages

logger = logging.getLogger(__name__)

QUALIFICATION_QUESTIONS = [
    "What is the size of your team?",
    "What is your annual budget for this initiative?",
    "What is your timeline for making a decision?",
    "Who else is involved in the buying process?",
]


def _determine_stage(state: AgentState) -> str:
    history = state.get('conversation_history', [])
    messages = state.get('messages', [])
    all_msgs = history + messages

    human_count = sum(
        1 for m in all_msgs if m.get('role') == 'user' or isinstance(m, HumanMessage)
    )
    ai_count = sum(
        1 for m in all_msgs if m.get('role') == 'assistant' or isinstance(m, AIMessage)
    )

    if human_count == 0:
        return 'new_lead'
    if human_count == 1 and ai_count <= 1:
        return 'qualification_start'
    if human_count < 4:
        return 'qualification_mid'
    return 'qualification_done'


def generate_mock_response(state: AgentState) -> dict:
    stage = _determine_stage(state)
    lead_data = state.get('lead_data', {})
    business_data = state.get('business_data', {})
    lead_name = lead_data.get('name', 'there')
    business_name = business_data.get('name', 'our company')

    if stage == 'new_lead':
        return {
            'decision': 'send_message',
            'tool_output': {
                'tool': 'send_email',
                'to': lead_data.get('email', ''),
                'subject': f'Welcome {lead_name}! Let\'s connect',
                'body': (
                    f'Hi {lead_name},\n\n'
                    f'Thank you for your interest in {business_name}. '
                    f'We\'d love to learn more about your needs and see how we can help.\n\n'
                    f'Would you be available for a quick 15-minute call this week?\n\n'
                    f'Best regards,\n{business_name} Team'
                ),
            },
            'should_finish': False,
            'next_action': 'send_welcome',
        }

    if stage == 'qualification_start':
        question = QUALIFICATION_QUESTIONS[0]
        return {
            'decision': 'send_message',
            'tool_output': {
                'tool': 'send_email',
                'to': lead_data.get('email', ''),
                'subject': f'Quick question, {lead_name}',
                'body': (
                    f'Hi {lead_name},\n\n'
                    f'Great to hear from you! To better understand how we can help, '
                    f'I have a few quick questions.\n\n'
                    f'{question}\n\n'
                    f'Looking forward to your response.\n\n'
                    f'Best,\n{business_name} Team'
                ),
            },
            'should_finish': False,
            'next_action': 'qualify_lead',
        }

    if stage == 'qualification_mid':
        question_idx = min(
            len(state.get('conversation_history', [])),
            len(QUALIFICATION_QUESTIONS) - 1,
        )
        question = QUALIFICATION_QUESTIONS[question_idx]
        return {
            'decision': 'send_message',
            'tool_output': {
                'tool': 'send_email',
                'to': lead_data.get('email', ''),
                'subject': f'Following up, {lead_name}',
                'body': (
                    f'Hi {lead_name},\n\n'
                    f'Thanks for the information! One more question:\n\n'
                    f'{question}\n\n'
                    f'We\'re building a tailored proposal for you.\n\n'
                    f'Best,\n{business_name} Team'
                ),
            },
            'should_finish': False,
            'next_action': 'qualify_lead',
        }

    score = lead_data.get('score', 0)
    if score >= 50:
        return {
            'decision': 'book_meeting',
            'tool_output': {
                'tool': 'book_meeting',
                'lead_id': state['lead_id'],
                'title': f'Discovery call with {lead_name}',
                'duration_minutes': 30,
            },
            'should_finish': False,
            'next_action': 'book_meeting',
        }
    return {
        'decision': 'schedule_followup',
        'tool_output': {
            'tool': 'schedule_followup',
            'lead_id': state['lead_id'],
            'message': (
                f'Hi {lead_name}, just checking in to see if you had a chance '
                f'to think about our conversation. We\'re here to help whenever '
                f'you\'re ready!'
            ),
        },
        'should_finish': False,
        'next_action': 'schedule_followup',
    }


def _build_llm(business_data: dict):
    provider = business_data.get('ai_provider', 'mock')
    api_key = business_data.get('ai_api_key', '')
    base_url = business_data.get('ai_base_url', '')
    model = business_data.get('ai_model', '')
    temperature = business_data.get('ai_temperature', 0.7)
    max_tokens = business_data.get('ai_max_tokens', 1024)

    if provider == 'mock':
        return None

    if provider == 'openai':
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=api_key or os.environ.get('OPENAI_API_KEY', ''),
                model=model or 'gpt-4o',
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except ImportError:
            logger.error("langchain-openai not installed. Run: pip install langchain-openai")
            return None

    if provider == 'openai_compatible':
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                api_key=api_key,
                base_url=base_url or 'https://openrouter.ai/api/v1',
                model=model or 'openai/gpt-4o',
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except ImportError:
            logger.error("langchain-openai not installed. Run: pip install langchain-openai")
            return None

    if provider == 'anthropic':
        try:
            from langchain_anthropic import ChatAnthropic
            return ChatAnthropic(
                api_key=api_key,
                model=model or 'claude-sonnet-4-20250514',
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except ImportError:
            logger.error("langchain-anthropic not installed. Run: pip install langchain-anthropic")
            return None

    if provider == 'google':
        try:
            from langchain_google_genai import ChatGoogleGenerativeAI
            return ChatGoogleGenerativeAI(
                google_api_key=api_key,
                model=model or 'gemini-pro',
                temperature=temperature,
                max_output_tokens=max_tokens,
            )
        except ImportError:
            logger.error("langchain-google-genai not installed. Run: pip install langchain-google-genai")
            return None

    if provider == 'mistral':
        try:
            from langchain_mistralai import ChatMistralAI
            return ChatMistralAI(
                api_key=api_key,
                model=model or 'mistral-large-latest',
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except ImportError:
            logger.error("langchain-mistralai not installed. Run: pip install langchain-mistralai")
            return None

    if provider == 'local':
        try:
            from langchain_openai import ChatOpenAI
            return ChatOpenAI(
                base_url=base_url or 'http://localhost:11434/v1',
                model=model or 'llama3',
                api_key='no-key',
                temperature=temperature,
                max_tokens=max_tokens,
            )
        except ImportError:
            logger.error("langchain-openai not installed. Run: pip install langchain-openai")
            return None

    return None


# ---------------------------------------------------------------------------
# Graph nodes
# ---------------------------------------------------------------------------


def load_lead(state: AgentState) -> dict:
    from apps.leads.models import Lead

    lead = Lead.objects.get(id=state['lead_id'])
    return {
        'lead_data': {
            'id': str(lead.id),
            'name': lead.name,
            'email': lead.email,
            'phone': lead.phone,
            'company': lead.company,
            'status': lead.status,
            'score': lead.score,
            'source': lead.source,
            'notes': lead.notes,
        },
    }


def load_business(state: AgentState) -> dict:
    from apps.businesses.models import Business

    business = Business.objects.get(id=state['business_id'])
    return {
        'business_data': {
            'id': str(business.id),
            'name': business.name,
            'industry': business.industry,
            'description': business.description,
            'services': business.services,
            'faq': business.faq,
            'timezone': business.timezone,
            'ai_prompt_config': business.ai_prompt_config,
            'ai_provider': business.ai_provider,
            'ai_api_key': business.ai_api_key,
            'ai_base_url': business.ai_base_url,
            'ai_model': business.ai_model,
            'ai_temperature': business.ai_temperature,
            'ai_max_tokens': business.ai_max_tokens,
        },
    }


def load_history(state: AgentState) -> dict:
    if state.get('conversation_history'):
        return {}
    return {'conversation_history': []}


def load_memory(state: AgentState) -> dict:
    from .models import AgentMemory

    memories = AgentMemory.objects.filter(
        business_id=state['business_id'],
    ).filter(
        lead_id=state['lead_id'],
    ) | AgentMemory.objects.filter(
        business_id=state['business_id'],
        lead__isnull=True,
    )
    memory_list = [
        {'type': m.memory_type, 'content': m.content, 'created_at': m.created_at.isoformat()}
        for m in memories[:20]
    ]
    return {'memory': memory_list}


def decide_action(state: AgentState) -> dict:
    business_data = state.get('business_data', {})
    provider = business_data.get('ai_provider', 'mock')

    if provider == 'mock':
        result = generate_mock_response(state)
        return {
            'decision': result['decision'],
            'tool_output': result['tool_output'],
            'should_finish': result['should_finish'],
            'messages': [
                {
                    'role': 'assistant',
                    'content': f"Decision: {result['decision']}",
                    'metadata': {'next_action': result.get('next_action')},
                }
            ],
        }

    llm = _build_llm(business_data)
    if llm is None:
        logger.warning("Failed to build LLM for provider '%s', falling back to mock", provider)
        result = generate_mock_response(state)
        return {
            'decision': result['decision'],
            'tool_output': result['tool_output'],
            'should_finish': result['should_finish'],
            'messages': [
                {'role': 'assistant', 'content': f"Decision: {result['decision']}"}
            ],
        }

    try:
        system_prompt = _build_system_prompt(state)
        messages = [SystemMessage(content=system_prompt)]

        for msg in state.get('conversation_history', []):
            if msg.get('role') == 'user':
                messages.append(HumanMessage(content=msg['content']))
            elif msg.get('role') == 'assistant':
                messages.append(AIMessage(content=msg['content']))

        for msg in state.get('messages', []):
            if isinstance(msg, dict):
                if msg.get('role') == 'user':
                    messages.append(HumanMessage(content=msg['content']))
                elif msg.get('role') == 'assistant':
                    messages.append(AIMessage(content=msg['content']))
            elif isinstance(msg, BaseMessage):
                messages.append(msg)

        response = llm.invoke(messages)
        return {
            'decision': 'llm_response',
            'tool_output': {'response': response.content},
            'should_finish': False,
            'messages': [{'role': 'assistant', 'content': response.content}],
        }
    except Exception as exc:
        logger.exception("LLM call failed, falling back to mock: %s", exc)
        result = generate_mock_response(state)
        return {
            'decision': result['decision'],
            'tool_output': result['tool_output'],
            'should_finish': result['should_finish'],
            'messages': [
                {'role': 'assistant', 'content': f"Decision: {result['decision']}"}
            ],
        }


def _build_system_prompt(state: AgentState) -> str:
    business = state.get('business_data', {})
    lead = state.get('lead_data', {})
    memory = state.get('memory', [])

    custom_prompt = business.get('ai_prompt_config', {}).get('system_prompt', '')

    prompt_parts = [
        custom_prompt or (
            "You are an AI sales assistant for {business_name}. "
            "Your role is to qualify leads and book meetings."
        ).format(business_name=business.get('name', 'the company')),
        f"\nIndustry: {business.get('industry', 'Unknown')}",
        f"Services: {', '.join(business.get('services', []))}",
        f"Lead: {lead.get('name', 'Unknown')} ({lead.get('company', 'Unknown company')})",
        f"Lead score: {lead.get('score', 0)}/100",
        f"Current status: {lead.get('status', 'new')}",
    ]

    if memory:
        prompt_parts.append("\nRelevant context from memory:")
        for mem in memory[:5]:
            prompt_parts.append(f"- [{mem['type']}] {mem['content']}")

    prompt_parts.extend([
        "\nYour goal:",
        "1. Understand the lead's needs",
        "2. Qualify them based on budget, timeline, and fit",
        "3. If qualified, book a meeting",
        "4. If not ready, schedule a follow-up",
        "\nRespond with a JSON object containing:",
        '- "decision": one of "send_message", "book_meeting", "schedule_followup", "update_status", "notify_sales", "search_knowledge", "create_note"',
        '- "tool_output": the data needed for that tool',
        '- "should_finish": true if the conversation is complete',
    ])

    return "\n".join(prompt_parts)


def call_tool(state: AgentState) -> dict:
    tool_output = state.get('tool_output', {})
    tool_name = tool_output.get('tool', '')

    tool_map = {
        'send_email': lambda: send_email(
            tool_output.get('to', ''),
            tool_output.get('subject', ''),
            tool_output.get('body', ''),
        ),
        'book_meeting': lambda: book_meeting(
            tool_output.get('lead_id', state['lead_id']),
            tool_output.get('meeting_datetime', ''),
            tool_output.get('duration_minutes', 30),
            tool_output.get('title', 'Meeting'),
        ),
        'schedule_followup': lambda: schedule_followup(
            tool_output.get('lead_id', state['lead_id']),
            tool_output.get('followup_datetime', ''),
            tool_output.get('message', ''),
        ),
        'update_lead_status': lambda: update_lead_status(
            tool_output.get('lead_id', state['lead_id']),
            tool_output.get('new_status', ''),
        ),
        'notify_sales': lambda: notify_sales(
            state['business_id'],
            tool_output.get('message', ''),
        ),
        'search_knowledge': lambda: search_knowledge(
            state['business_id'],
            tool_output.get('query', ''),
        ),
        'create_note': lambda: create_note(
            tool_output.get('lead_id', state['lead_id']),
            tool_output.get('content', ''),
        ),
    }

    if tool_name in tool_map:
        try:
            result = tool_map[tool_name]()
            return {
                'tool_output': {**tool_output, 'result': result},
                'messages': [
                    {
                        'role': 'assistant',
                        'content': f"Tool '{tool_name}' executed: {result}",
                    }
                ],
            }
        except Exception as exc:
            logger.exception("Tool %s failed: %s", tool_name, exc)
            return {
                'tool_output': {**tool_output, 'result': {'success': False, 'error': str(exc)}},
                'messages': [
                    {'role': 'assistant', 'content': f"Tool '{tool_name}' failed: {exc}"}
                ],
            }

    return {
        'tool_output': {**tool_output, 'result': {'success': True, 'note': 'No tool matched'}},
    }


def save_output(state: AgentState) -> dict:
    from .models import AgentMemory

    decision = state.get('decision', '')
    tool_output = state.get('tool_output', {})

    if decision in ('send_message', 'book_meeting', 'schedule_followup'):
        AgentMemory.objects.create(
            business_id=state['business_id'],
            lead_id=state['lead_id'],
            memory_type='interaction',
            content={
                'decision': decision,
                'tool_output': tool_output,
            },
        )

    return {}


def finish(state: AgentState) -> dict:
    return {
        'should_finish': True,
        'messages': [
            {'role': 'assistant', 'content': 'Agent execution completed.'}
        ],
    }


# ---------------------------------------------------------------------------
# Tool imports
# ---------------------------------------------------------------------------

from .tools import (  # noqa: E402
    send_email,
    book_meeting,
    schedule_followup,
    update_lead_status,
    notify_sales,
    search_knowledge,
    create_note,
)


# ---------------------------------------------------------------------------
# Routing
# ---------------------------------------------------------------------------


def route_after_decide(state: AgentState) -> str:
    if state.get('should_finish'):
        return 'finish'
    decision = state.get('decision', '')
    if decision in (
        'send_message',
        'book_meeting',
        'schedule_followup',
        'update_lead_status',
        'notify_sales',
        'search_knowledge',
        'create_note',
    ):
        return 'call_tool'
    return 'finish'


# ---------------------------------------------------------------------------
# Graph construction
# ---------------------------------------------------------------------------


def build_graph() -> StateGraph:
    graph = StateGraph(AgentState)

    graph.add_node('load_lead', load_lead)
    graph.add_node('load_business', load_business)
    graph.add_node('load_history', load_history)
    graph.add_node('load_memory', load_memory)
    graph.add_node('decide_action', decide_action)
    graph.add_node('call_tool', call_tool)
    graph.add_node('save_output', save_output)
    graph.add_node('finish', finish)

    graph.set_entry_point('load_lead')
    graph.add_edge('load_lead', 'load_business')
    graph.add_edge('load_business', 'load_history')
    graph.add_edge('load_history', 'load_memory')
    graph.add_edge('load_memory', 'decide_action')

    graph.add_conditional_edges(
        'decide_action',
        route_after_decide,
        {
            'call_tool': 'call_tool',
            'finish': 'finish',
        },
    )
    graph.add_edge('call_tool', 'save_output')
    graph.add_edge('save_output', 'finish')
    graph.add_edge('finish', END)

    return graph


_compiled_graph = None


def get_compiled_graph():
    global _compiled_graph
    if _compiled_graph is None:
        _compiled_graph = build_graph().compile()
    return _compiled_graph
