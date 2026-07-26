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
    # ── Classical Sanskrit ──
    {
        "title": "भगवद्गीता — अध्याय २",
        "title_iast": "Bhagavad Gītā — Chapter 2",
        "content": "धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः ।\nमामकाः पाण्डवाश्चैव किमकुर्वत सञ्जय ॥\n\nएवमुक्तो हृषीकेशो गुडाकेशेन भारत ।\nसेनयोरुभयोर्मध्ये स्थापयित्वा रथोत्तमम् ॥",
        "content_iast": "dharmakṣetre kurukṣetre samavetā yuyutsavaḥ |\nmāmakāḥ pāṇḍavāścaiva kimakurvata sañjaya ||\n\nevamukto hṛṣīkeśo guḍākeśena bhārata |\nsenayorubhayormadhye sthāpayitvā rathottamam ||",
        "language": "sa", "source": "Mahābhārata — Vyāsa", "tags": ["vedic", "philosophy", "classical"],
    },
    {
        "title": "भगवद्गीता — अध्याय ४ (ज्ञानकर्मसंन्यासयोग)",
        "title_iast": "Bhagavad Gītā — Chapter 4 (Jñānakarmasannyāsayoga)",
        "content": "इमं विवस्वते योगं प्रोक्तवानहमव्ययम् ।\nविवस्वान्मनवे प्राह मनुरिक्ष्वाकवेऽब्रवीत् ॥\n\nएवं परम्पराप्राप्तमिमं राजर्षयो विदुः ।\nस कालेनेह महता योगो नष्टः परन्तप ॥",
        "content_iast": "imaṃ vivasvate yogaṃ proktavānahamavyayam |\nvivasvānmanave prāha manurikṣvākave'bravīt ||\n\nevaṃ paramparāprāptamimaṃ rājarṣayo viduḥ |\nsa kāleneha mahatā yogo naṣṭaḥ parantapa ||",
        "language": "sa", "source": "Mahābhārata — Vyāsa", "tags": ["vedic", "philosophy", "yoga"],
    },
    {
        "title": "ईशावास्य उपनिषद्",
        "title_iast": "Īśāvāsya Upaniṣad",
        "content": "ईशा वास्यमिदं सर्वं यत्किञ्च जगत्यां जगत् ।\nतेन त्यक्तेन भुञ्जीथा मा गृधः कस्यस्विद्धनम् ॥",
        "content_iast": "īśā vāsyamidaṃ sarvaṃ yatkiñca jagatyāṃ jagat |\n tena tyaktena bhuñjīthā mā gṛdhaḥ kasyasviddhanam ||",
        "language": "sa", "source": "Śukla Yajurveda", "tags": ["upanishad", "vedic", "philosophy"],
    },
    {
        "title": "केनोपनिषद्",
        "title_iast": "Kenopaniṣad",
        "content": "केनेषितं पतति प्रेषितं मनः केन प्राणः प्रथमः प्रैति युक्तः ।\nकेनेषितां वाचमिमां वदन्ति चक्षुः श्रोत्रं क उ देवो युनक्ति ॥",
        "content_iast": "keneṣitaṃ patati preṣitaṃ manaḥ kena prāṇaḥ prathamaḥ praiti yuktaḥ |\n keneṣitāṃ vācamimāṃ vadanti cakṣuḥ śrotraṃ ka u devo yunakti ||",
        "language": "sa", "source": "Sāmaveda", "tags": ["upanishad", "vedic", "philosophy"],
    },
    {
        "title": "अष्टाध्यायी १.१ — वृद्धिरादैच्",
        "title_iast": "Aṣṭādhyāyī 1.1 — Vṛddhirādaic",
        "content": "वृद्धिरादैच् । अदेङ् गुणः । इको गुणवृद्धी ।",
        "content_iast": "vṛddhirādaic | adeṅ guṇaḥ | iko guṇavṛddhī |",
        "language": "sa", "source": "Pāṇini", "tags": ["grammar", "vyakarana", "classical"],
    },
    {
        "title": "अभिज्ञानशाकुन्तलम् — प्रथमाङ्कः",
        "title_iast": "Abhijñānaśākuntalam — Act 1",
        "content": "मा निषाद प्रतिष्ठां त्वमगमः शाश्वतीः समाः ।\nयत्क्रौञ्चमिथुनादेकमवधीः काममोहितम् ॥",
        "content_iast": "mā niṣāda pratiṣṭhāṃ tvamagamaḥ śāśvatīḥ samāḥ |\nyatkrauñcamithunādekamavadhīḥ kāmamohitam ||",
        "language": "sa", "source": "Kālidāsa", "tags": ["drama", "classical", "kavya"],
    },
    {
        "title": "रघुवंशम् — सर्ग १",
        "title_iast": "Raghuvaṃśam — Canto 1",
        "content": "वागर्थाविव संपृक्तौ वागर्थप्रतिपत्तये ।\nजगतः पितरौ वन्दे पार्वतीपरमेश्वरौ ॥",
        "content_iast": "vāgarthāviva saṃpṛktau vāgarthapratipattaye |\n jagataḥ pitarau vande pārvatīparameśvarau ||",
        "language": "sa", "source": "Kālidāsa", "tags": ["kavya", "classical", "poetry"],
    },
    {
        "title": "न्यायसूत्रम् १.१.१",
        "title_iast": "Nyāyasūtram 1.1.1",
        "content": "प्रमाणप्रमेयसंशयप्रयोजनदृष्टान्तसिद्धान्तावयवतर्कनिर्णयवादजल्पवितण्डाहेत्वाभासच्छलजातिनिग्रहस्थानानां तत्त्वज्ञानान्निःश्रेयसाधिगमः ।",
        "content_iast": "pramāṇaprameyasaṃśayaprayojanadṛṣṭāntasiddhāntāvayavatarkanirṇayavādajalpavitaṇḍāhetvābhāsacchalajātinigrahasthānānāṃ tattvajñānānniḥśreyasādhigamaḥ |",
        "language": "sa", "source": "Gautama", "tags": ["philosophy", "logic", "classical"],
    },
    # ── Hindi Literature ──
    {
        "title": "रामचरितमानस — बालकाण्ड",
        "title_iast": "Rāmacaritamānasa — Bālakāṇḍa",
        "content": "वर्णानामर्थसङ्घानां रसानां छन्दसामपि ।\nमङ्गलानां च कर्तारौ वन्दे वाणीविनायकौ ॥",
        "content_iast": "varṇānāmarthasaṅghānāṃ rasānāṃ chandasāmapi |\nmaṅgalānāṃ ca kartārau vande vāṇīvināyakau ||",
        "language": "hi", "source": "Tulasīdāsa", "tags": ["ramayana", "bhakti", "classical"],
    },
    {
        "title": "गोदान — उद्धरण",
        "title_iast": "Godān — Excerpt",
        "content": "हल्कू ने आँखें ऊपर उठाईं । झोपड़ी के दरवाजे पर सन का परदा पड़ा हुआ था । भीतर से उसकी स्त्री धनिया की आवाज़ आ रही थी — \"हल्कू ! अब उठ भी ।\"",
        "content_iast": "",
        "language": "hi", "source": "Munshi Premchand", "tags": ["modern", "novel", "realism"],
    },
    {
        "title": "गोदान — गाँव का जीवन",
        "title_iast": "Godān — Village Life",
        "content": "गाँव में एक ही समय में अनेकानेक समस्याएँ होती हैं, जो जीवन को विषम बना देती हैं। किसान की जिंदगी, उसकी मजबूरियाँ, और साहूकार का शोषण — यही प्रेमचंद के इस उपन्यास का मूल स्वर है।",
        "content_iast": "",
        "language": "hi", "source": "Munshi Premchand", "tags": ["modern", "novel", "realism"],
    },
    {
        "title": "चिदम्बरा — कविता",
        "title_iast": "Chidambara — Poem",
        "content": "नदी के किनारे\nसन्नाटा पगलाया है\nचाँदनी रात में\nबरगद की छाँह में\nसपनों की गठरी खोल\nकोई सोया है ।",
        "content_iast": "",
        "language": "hi", "source": "Suryakant Tripathi 'Nirala'", "tags": ["modern", "poetry", "chhayavaad"],
    },
    {
        "title": "मधुशाला",
        "title_iast": "Madhushala",
        "content": "मदिरालय जाने को घर से चलता है पीनेवाला ।\nकिस पथ से जाऊँ? यह समझता है नहीं मतवाला ॥\n\nसब पथों के हो जाते हैं एक किनारा आखिर,\nजाने किधर से आया है, किस ओर गया मतवाला ।",
        "content_iast": "",
        "language": "hi", "source": "Harivansh Rai Bachchan", "tags": ["modern", "poetry", "classical"],
    },
    {
        "title": "यामा — कविता",
        "title_iast": "Yama — Poem",
        "content": "तुम्हारी याद में\nहर शाम एक चादर ओढ़े\nबैठा रहता हूँ\nदीवारों पर टँगी\nतुम्हारी तस्वीरों से\nबातें करता हूँ ।",
        "content_iast": "",
        "language": "hi", "source": "Mahadevi Verma", "tags": ["modern", "poetry", "chhayavaad"],
    },
    {
        "title": "कामायनी — श्रद्धा सर्ग",
        "title_iast": "Kamayani — Shraddha Sarga",
        "content": "कल्पवृक्ष का फल मिला है, मानव केवल श्रम तू कर ।\nविधुर बनाकर छोड़ दिया है, विधि ने तुझको निर्भर ॥\n\nनीड़ बना ले शाख से अपनी, आप ही आप उड़ा न कर ।\nपथिक बनाकर छोड़ दिया है, विधि ने तुझको भटक भर ॥",
        "content_iast": "",
        "language": "hi", "source": "Jaishankar Prasad", "tags": ["modern", "poetry", "epic"],
    },
    {
        "title": "निर्मला — पहला अध्याय",
        "title_iast": "Nirmala — Chapter 1",
        "content": "निर्मला पढ़ तो गई थी, पर उसकी समझ में कुछ नहीं आया था । उसका दिल धड़क रहा था, और आँखों से आँसू बह रहे थे। वह सोच रही थी — यह कैसा रिश्ता है जिसमें भावनाओं की कोई कीमत नहीं?",
        "content_iast": "",
        "language": "hi", "source": "Munshi Premchand", "tags": ["modern", "novel", "social"],
    },
    {
        "title": "पिंजर — कहानी अंश",
        "title_iast": "Pinjar — Story Excerpt",
        "content": "पिंजरे में बंद पक्षी की तरह वह दिन-रात तड़पती रहती। उसे याद आता — वह मैदान, वह बगीचा, वह नाचते गाते दोस्त, और वह मासूम सपने जो आज टूटकर बिखर गए थे ।",
        "content_iast": "",
        "language": "hi", "source": "Amrita Pritam", "tags": ["modern", "story", "partition"],
    },
]


@router.post("/corpus", status_code=201)
async def seed_corpus(
    db: AsyncSession = Depends(get_db),
):
    admin = await db.execute(select(User).where(User.role == "admin"))
    admin_user = admin.scalar_one_or_none()
    if not admin_user:
        return {"error": "No admin user found. Create an admin first."}

    count = 0
    for data in SEED_TEXTS:
        existing = await db.execute(
            select(CorpusText).where(CorpusText.title == data["title"])
        )
        if existing.scalar_one_or_none():
            continue
        text = CorpusText(**data, uploaded_by=admin_user.id, is_verified=True)
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
