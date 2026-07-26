import uuid

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.dependencies import require_role
from app.core.security import hash_password
from app.models.user import User
from app.models.content import CorpusText
from app.models.badge import UserScore

router = APIRouter(prefix="/seed", tags=["seed"])

SEED_TEXTS = [
    {
        "title": "भगवद्गीता — अध्याय २",
        "title_iast": "Bhagavad Gītā — Chapter 2",
        "content": (
            "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\n"
            "मामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥\n\n"
            "एवमुक्तो हृषीकेशो गुडाकेशेन भारत ।\n"
            "सेनयोरुभयोर्मध्ये स्थापयित्वा रथोत्तमम् ॥"
        ),
        "content_iast": (
            "dharmakṣetre kurukṣetre samavetā yuyutsavaḥ |\n"
            "māmakāḥ pāṇḍavāścaiva kimakurvata sañjaya ||\n\n"
            "evamukto hṛṣīkeśo guḍākeśena bhārata |\n"
            "senayorubhayormadhye sthāpayitvā rathottamam ||"
        ),
        "language": "sa",
        "source": "Mahābhārata — Vyāsa",
        "tags": ["vedic", "philosophy", "classical"],
    },
    {
        "title": "ईशावास्य उपनिषद्",
        "title_iast": "Īśāvāsya Upaniṣad",
        "content": (
            "ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत् ।\n"
            "तेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम् ॥"
        ),
        "content_iast": (
            "īśā vāsyamidaṃ sarvaṃ yatkiñca jagatyāṃ jagat |\n"
            "tena tyaktena bhuñjīthā mā gṛdhaḥ kasyasviddhanam ||"
        ),
        "language": "sa",
        "source": "Śukla Yajurveda",
        "tags": ["upanishad", "vedic", "philosophy"],
    },
    {
        "title": "रामचरितमानस — बालकाण्ड",
        "title_iast": "Rāmacaritamānasa — Bālakāṇḍa",
        "content": (
            "वर्णानामर्थसङ्घानां रसानां छन्दसामपि ।\n"
            "मङ्गलानां च कर्तारौ वन्दे वाणीविनायकौ ॥"
        ),
        "content_iast": (
            "varṇānāmarthasaṅghānāṃ rasānāṃ chandasāmapi |\n"
            "maṅgalānāṃ ca kartārau vande vāṇīvināyakau ||"
        ),
        "language": "hi",
        "source": "Tulasīdāsa",
        "tags": ["ramayana", "bhakti", "classical"],
    },
    {
        "title": "अष्टाध्यायी १.१",
        "title_iast": "Aṣṭādhyāyī 1.1",
        "content": "वृद्धिरादैच् । अदेङ् गुणः । इको गुणवृद्धी ।",
        "content_iast": "vṛddhirādaic | adeṅ guṇaḥ | iko guṇavṛddhī |",
        "language": "sa",
        "source": "Pāṇini",
        "tags": ["grammar", "vyakarana", "classical"],
    },
    {
        "title": "गीतांजलि — कविता १",
        "title_iast": "Gītāñjali — Poem 1",
        "content": (
            "तूने मुझको अनन्त जीवन दिया है — यह तेरी करुणा ।\n"
            "यह क्षण-क्षण भरनेवाला प्याला — तूने ही भरा है ।"
        ),
        "content_iast": "",
        "language": "hi",
        "source": "Rabindranath Tagore",
        "tags": ["modern", "poetry", "bhakti"],
    },
]


@router.post("/corpus", status_code=201)
async def seed_corpus(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role("admin")),
):
    count = 0
    for data in SEED_TEXTS:
        existing = await db.execute(
            select(CorpusText).where(CorpusText.title == data["title"])
        )
        if existing.scalar_one_or_none():
            continue
        text = CorpusText(**data, uploaded_by=admin.id, is_verified=True)
        db.add(text)
        count += 1

    await db.flush()
    return {"seeded": count, "total": len(SEED_TEXTS)}


@router.post("/demo-user", status_code=201)
async def seed_demo_user(db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == "demo@sansi.app"))
    if existing.scalar_one_or_none():
        return {"message": "Demo user already exists"}

    user = User(
        email="demo@sansi.app",
        username="demo",
        hashed_password=hash_password("demo123"),
        display_name="Demo User",
        role="contributor",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    score = UserScore(user_id=user.id, total_points=150)
    db.add(score)

    return {
        "message": "Demo user created",
        "email": "demo@sansi.app",
        "password": "demo123",
        "role": "contributor",
    }
