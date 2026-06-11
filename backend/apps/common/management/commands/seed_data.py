import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.users.models import User
from apps.businesses.models import Business
from apps.leads.models import Lead, LeadNote
from apps.conversations.models import Conversation, Message
from apps.knowledge.models import KnowledgeDocument
from apps.calendar_integration.models import CalendarEvent
from apps.notifications.models import Notification
from apps.analytics.models import AnalyticsSnapshot
from apps.agent.models import AgentExecution, AgentMemory


class Command(BaseCommand):
    help = 'Seed the database with sample data (idempotent)'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE('Seeding database...'))

        self._create_superadmin()
        businesses = self._create_business_owners()
        staff_users = self._create_staff(businesses)
        leads = self._create_leads(businesses, staff_users)
        self._create_conversations(leads, businesses, staff_users)
        self._create_knowledge_entries(businesses)
        self._create_calendar_events(leads, businesses)
        self._create_notifications(staff_users, businesses)
        self._create_analytics(businesses)
        self._create_agent_data(leads, businesses)

        self.stdout.write(self.style.SUCCESS('Database seeding complete.'))

    def _create_superadmin(self):
        email = 'admin@leadflow.ai'
        if User.objects.filter(email=email).exists():
            self.stdout.write(f'  Superadmin {email} already exists, skipping.')
            return
        User.objects.create_superuser(
            email=email,
            password='admin123',
            first_name='Admin',
            last_name='User',
            role=User.Role.SUPER_ADMIN,
        )
        self.stdout.write(self.style.SUCCESS(f'  Created superadmin: {email}'))

    def _create_business_owners(self):
        business_data = [
            {
                'email': 'alice@techcorp.io',
                'first_name': 'Alice',
                'last_name': 'Johnson',
                'business_name': 'TechCorp Solutions',
                'industry': 'Technology',
                'description': 'Enterprise software solutions and consulting.',
            },
            {
                'email': 'bob@greenlaw.com',
                'first_name': 'Bob',
                'last_name': 'Martinez',
                'business_name': 'GreenLaw Associates',
                'industry': 'Legal',
                'description': 'Environmental law and sustainability consulting.',
            },
        ]
        businesses = []
        for data in business_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': User.Role.BUSINESS_OWNER,
                },
            )
            if created:
                user.set_password('owner123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  Created business owner: {data["email"]}'))
            else:
                self.stdout.write(f'  Owner {data["email"]} already exists, skipping.')

            business, b_created = Business.objects.get_or_create(
                owner=user,
                defaults={
                    'name': data['business_name'],
                    'industry': data['industry'],
                    'description': data['description'],
                    'services': ['Consulting', 'Implementation', 'Support'],
                    'faq': [{'q': 'What do you do?', 'a': data['description']}],
                    'timezone': 'UTC',
                    'operating_hours': {'mon': '9-17', 'tue': '9-17'},
                },
            )
            if b_created:
                user.business = business
                user.save(update_fields=['business'])
                self.stdout.write(self.style.SUCCESS(f'  Created business: {data["business_name"]}'))
            else:
                self.stdout.write(f'  Business {data["business_name"]} already exists, skipping.')

            businesses.append(business)

        return businesses

    def _create_staff(self, businesses):
        staff_data = [
            {'email': 'carol@techcorp.io', 'first_name': 'Carol', 'last_name': 'Lee', 'biz_idx': 0},
            {'email': 'dave@techcorp.io', 'first_name': 'Dave', 'last_name': 'Wilson', 'biz_idx': 0},
            {'email': 'eve@greenlaw.com', 'first_name': 'Eve', 'last_name': 'Davis', 'biz_idx': 1},
            {'email': 'frank@techcorp.io', 'first_name': 'Frank', 'last_name': 'Brown', 'biz_idx': 0},
            {'email': 'grace@greenlaw.com', 'first_name': 'Grace', 'last_name': 'Taylor', 'biz_idx': 1},
        ]
        staff_users = []
        for data in staff_data:
            user, created = User.objects.get_or_create(
                email=data['email'],
                defaults={
                    'first_name': data['first_name'],
                    'last_name': data['last_name'],
                    'role': User.Role.STAFF,
                    'business': businesses[data['biz_idx']],
                },
            )
            if created:
                user.set_password('staff123')
                user.save()
                self.stdout.write(self.style.SUCCESS(f'  Created staff: {data["email"]}'))
            else:
                self.stdout.write(f'  Staff {data["email"]} already exists, skipping.')
            staff_users.append(user)
        return staff_users

    def _create_leads(self, businesses, staff_users):
        names = [
            ('John Smith', 'john@example.com', '+1-555-0101'),
            ('Sarah Connor', 'sarah@cyberdyne.com', '+1-555-0102'),
            ('Mike Johnson', 'mike.j@startup.io', '+1-555-0103'),
            ('Emily Chen', 'emily.chen@tech.net', '+1-555-0104'),
            ('David Park', 'david@innovate.co', '+1-555-0105'),
            ('Lisa Wang', 'lisa.wang@data.com', '+1-555-0106'),
            ('James Brown', 'james.b@enterprise.org', '+1-555-0107'),
            ('Maria Garcia', 'maria@global.com', '+1-555-0108'),
            ('Robert Taylor', 'robert.t@corp.net', '+1-555-0109'),
            ('Jennifer Lee', 'jennifer.l@digital.io', '+1-555-0110'),
            ('William Davis', 'will.d@cloud.com', '+1-555-0111'),
            ('Patricia Moore', 'patricia.m@ai.tech', '+1-555-0112'),
            ('Thomas Anderson', 'neo@matrix.com', '+1-555-0113'),
            ('Jessica White', 'jess.w@media.co', '+1-555-0114'),
            ('Daniel Kim', 'daniel.k@finance.com', '+1-555-0115'),
            ('Amanda Harris', 'amanda.h@health.io', '+1-555-0116'),
            ('Christopher Clark', 'chris.c@legal.com', '+1-555-0117'),
            ('Michelle Lewis', 'michelle.l@retail.com', '+1-555-0118'),
        ]

        sources = [s[0] for s in Lead.Source.choices]
        statuses = [s[0] for s in Lead.Status.choices]

        leads = []
        for i, (name, email, phone) in enumerate(names):
            biz = businesses[i % len(businesses)]
            staff_pool = [s for s in staff_users if s.business == biz]
            if Lead.objects.filter(email=email, business=biz).exists():
                self.stdout.write(f'  Lead {email} already exists, skipping.')
                leads.append(Lead.objects.filter(email=email, business=biz).first())
                continue

            lead = Lead.objects.create(
                business=biz,
                name=name,
                email=email,
                phone=phone,
                company=f'{name.split()[-1]} Inc.',
                source=random.choice(sources),
                status=random.choice(statuses),
                score=random.randint(0, 100),
                assigned_to=random.choice(staff_pool) if staff_pool else None,
                tags=random.sample(['vip', 'hot', 'follow-up', 'enterprise', 'smb', 'demo'], k=random.randint(1, 3)),
                notes=f'Initial note for {name}.',
            )
            LeadNote.objects.create(
                lead=lead,
                content=f'Created lead from seed data for {name}.',
                created_by=staff_pool[0] if staff_pool else None,
            )
            leads.append(lead)

        self.stdout.write(self.style.SUCCESS(f'  Created {len(leads)} leads.'))
        return leads

    def _create_conversations(self, leads, businesses, staff_users):
        conv_leads = random.sample(leads, min(8, len(leads)))
        channels = [c[0] for c in Conversation.Channel.choices]
        conversations = []

        for lead in conv_leads:
            if Conversation.objects.filter(lead=lead, business=lead.business).exists():
                self.stdout.write(f'  Conversation for {lead.name} already exists, skipping.')
                conversations.append(Conversation.objects.filter(lead=lead, business=lead.business).first())
                continue

            staff_pool = [s for s in staff_users if s.business == lead.business]
            conv = Conversation.objects.create(
                business=lead.business,
                lead=lead,
                status=random.choice([Conversation.Status.ACTIVE, Conversation.Status.ACTIVE, Conversation.Status.PAUSED]),
                channel=random.choice(channels),
                assigned_to=random.choice(staff_pool) if staff_pool else None,
                last_message_at=timezone.now() - timedelta(hours=random.randint(0, 48)),
            )

            sample_messages = [
                ('lead', f'Hi, I am interested in your services.'),
                ('ai', f'Hello {lead.name}! Thank you for reaching out. How can I help you today?'),
                ('lead', f'I would like to schedule a demo.'),
                ('ai', f'Great! Let me check availability and get back to you.'),
                ('staff', f'Hi {lead.name}, I will personally handle your inquiry.'),
            ]
            for sender_type, content in sample_messages[:random.randint(2, 5)]:
                Message.objects.create(
                    conversation=conv,
                    sender_type=sender_type,
                    content=content,
                    channel=conv.channel,
                    is_ai_generated=(sender_type == 'ai'),
                )
            conversations.append(conv)

        self.stdout.write(self.style.SUCCESS(f'  Created {len(conversations)} conversations with messages.'))
        return conversations

    def _create_knowledge_entries(self, businesses):
        documents = [
            ('Company Overview', 'We are a leading provider of innovative solutions.', 'txt'),
            ('Pricing Guide', 'Our pricing tiers: Basic $99/mo, Pro $299/mo, Enterprise custom.', 'txt'),
            ('FAQ Document', 'Q: What is your refund policy? A: 30-day money-back guarantee.', 'txt'),
            ('Onboarding Process', 'Step 1: Kickoff call. Step 2: Data migration. Step 3: Go live.', 'txt'),
            ('Service Level Agreement', 'We guarantee 99.9% uptime for enterprise customers.', 'txt'),
            ('Product Roadmap 2025', 'Q1: AI features. Q2: Mobile app. Q3: Integrations.', 'md'),
            ('Team Directory', 'Sales: Alice, Support: Carol, Engineering: Dave.', 'txt'),
            ('Case Studies', 'Client A achieved 40% cost reduction. Client B doubled leads.', 'md'),
            ('Competitor Analysis', 'We differentiate via AI-powered automation and white-glove support.', 'txt'),
            ('Brand Guidelines', 'Primary color: #0066FF. Font: Inter. Tone: Professional but friendly.', 'txt'),
        ]
        count = 0
        for title, content, doc_type in documents:
            biz = random.choice(businesses)
            if KnowledgeDocument.objects.filter(title=title, business=biz).exists():
                continue
            KnowledgeDocument.objects.create(
                business=biz,
                title=title,
                content=content,
                document_type=doc_type,
                is_indexed=random.choice([True, False]),
                file='knowledge/placeholder.txt',
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f'  Created {count} knowledge entries.'))

    def _create_calendar_events(self, leads, businesses):
        count = 0
        for lead in leads[:6]:
            if CalendarEvent.objects.filter(lead=lead, business=lead.business).exists():
                continue
            start = timezone.now() + timedelta(days=random.randint(-7, 14))
            CalendarEvent.objects.create(
                business=lead.business,
                lead=lead,
                title=f'Demo call with {lead.name}',
                description=f'Product demonstration for {lead.company or "their team"}.',
                start_time=start,
                end_time=start + timedelta(hours=1),
                status=random.choice([CalendarEvent.Status.SCHEDULED, CalendarEvent.Status.COMPLETED]),
            )
            count += 1
        self.stdout.write(self.style.SUCCESS(f'  Created {count} calendar events.'))

    def _create_notifications(self, staff_users, businesses):
        count = 0
        notif_types = [t[0] for t in Notification.NotificationType.choices]
        titles = [
            'New lead assigned to you',
            'Meeting booked with lead',
            'AI handoff request',
            'System maintenance scheduled',
            'New mention in conversation',
        ]
        for user in staff_users:
            for _ in range(random.randint(1, 3)):
                if Notification.objects.filter(
                    user=user,
                    title=random.choice(titles),
                ).exists():
                    continue
                Notification.objects.create(
                    user=user,
                    business=user.business,
                    title=random.choice(titles),
                    message=f'Notification message for {user.get_full_name()}.',
                    notification_type=random.choice(notif_types),
                    is_read=random.choice([True, False]),
                    link='/leads/',
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Created {count} notifications.'))

    def _create_analytics(self, businesses):
        count = 0
        today = timezone.now().date()
        for biz in businesses:
            for day_offset in range(30):
                date = today - timedelta(days=day_offset)
                if AnalyticsSnapshot.objects.filter(business=biz, date=date).exists():
                    continue
                base = random.randint(5, 20)
                AnalyticsSnapshot.objects.create(
                    business=biz,
                    date=date,
                    total_leads=base + day_offset,
                    new_leads=random.randint(1, 5),
                    qualified_leads=random.randint(0, 3),
                    meetings_booked=random.randint(0, 2),
                    conversion_rate=round(random.uniform(5.0, 35.0), 1),
                    avg_response_time=round(random.uniform(0.5, 5.0), 1),
                    ai_interactions=random.randint(2, 15),
                    active_conversations=random.randint(1, 8),
                )
                count += 1
        self.stdout.write(self.style.SUCCESS(f'  Created {count} analytics snapshots.'))

    def _create_agent_data(self, leads, businesses):
        exec_count = 0
        mem_count = 0
        for lead in leads[:6]:
            biz = lead.business
            if not AgentExecution.objects.filter(lead=lead, business=biz).exists():
                AgentExecution.objects.create(
                    lead=lead,
                    business=biz,
                    status=random.choice([AgentExecution.Status.COMPLETED, AgentExecution.Status.COMPLETED, AgentExecution.Status.FAILED]),
                    input_data={'lead_id': str(lead.id), 'business_id': str(biz.id)},
                    output_data={'decision': 'send_email', 'tool_output': {}},
                    started_at=timezone.now() - timedelta(hours=random.randint(1, 48)),
                    completed_at=timezone.now() - timedelta(hours=random.randint(0, 24)),
                )
                exec_count += 1

            if not AgentMemory.objects.filter(lead=lead, business=biz).exists():
                AgentMemory.objects.create(
                    business=biz,
                    lead=lead,
                    memory_type=random.choice([t[0] for t in AgentMemory.MemoryType.choices]),
                    content={'summary': f'Memory for lead {lead.name}', 'key_points': ['interested in demo', 'budget confirmed']},
                )
                mem_count += 1

        self.stdout.write(self.style.SUCCESS(f'  Created {exec_count} agent executions, {mem_count} agent memories.'))
