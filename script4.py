import os

filepath = r'c:\Users\user\OneDrive\Desktop\CODE\PCC_Personal-Control-Center\backend\app\services\assistant_service.py'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

imports = "import google.generativeai as genai\nfrom app.core.config import settings\n"
content = content.replace('from sqlalchemy.orm import Session', imports + 'from sqlalchemy.orm import Session')

init_code = '''
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)

'''

content = content.replace('class AssistantService:\n    """Service dispatcher for natural language execution and automated executive summaries."""\n', 'class AssistantService:\n    """Service dispatcher for natural language execution and automated executive summaries."""\n' + init_code)

old_else = '''        else:
            # Informational query dispatcher
            pending_count = db.query(Task).filter(Task.user_id == user_id, Task.status != TaskStatus.DONE).count()
            return AssistantQueryResponse(
                summary=f"PCC Assistant operational. You currently have {pending_count} pending tasks across your workspace.",
                intent_detected="GENERAL_QUERY",
                suggested_followups=[
                    "What are my high priority tasks?",
                    "Generate my daily briefing",
                    "Review my calendar events",
                ],
            )'''

new_else = '''        else:
            # Informational query dispatcher
            pending_count = db.query(Task).filter(Task.user_id == user_id, Task.status != TaskStatus.DONE).count()
            summary_text = f"PCC Assistant operational. You currently have {pending_count} pending tasks across your workspace."
            
            if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != 'AIzaSyBk_example_key_placeholder':
                try:
                    model = genai.GenerativeModel("gemini-2.0-flash")
                    prompt = "You are a Personal Control Center assistant. The user said: " + request.query
                    response = model.generate_content(prompt)
                    summary_text = response.text
                except Exception as e:
                    pass

            return AssistantQueryResponse(
                summary=summary_text,
                intent_detected="GENERAL_QUERY",
                suggested_followups=[
                    "What are my high priority tasks?",
                    "Generate my daily briefing",
                    "Review my calendar events",
                ],
            )'''

content = content.replace(old_else, new_else)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

