import logging
from datetime import datetime, date, timedelta, timezone
from sqlalchemy.orm import Session
from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.organization import Organization
from app.models.user import User
from app.models.destination import Destination
from app.models.experience import Experience
from app.models.customer import Customer
from app.models.lead import Lead
from app.models.interaction import CustomerInteraction
from app.models.booking import Booking
from app.models.itinerary import Itinerary, ItineraryActivity
from app.models.kpi import KPIDefinition, KPITarget, KPIRecord
from app.models.workflow import Workflow, WorkflowExecution
from app.models.report import Report
from app.models.notification import Notification

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed")

def seed_database():
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)

    db: Session = SessionLocal()
    try:
        # Check if already seeded
        existing_super = db.query(User).filter(User.email == "superadmin@tourismplatform.com").first()
        if existing_super:
            logger.info("Database is already seeded. Skipping initial seeding.")
            return

        logger.info("Seeding Super Admin...")
        super_admin = User(
            email="superadmin@tourismplatform.com",
            hashed_password=get_password_hash("SuperAdmin123!"),
            full_name="Alexander Wright (Super Admin)",
            role="super_admin",
            avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
            is_active=True
        )
        db.add(super_admin)
        db.flush()

        # Global KPI Definitions
        logger.info("Seeding KPI Definitions...")
        kpi_defs = [
            KPIDefinition(code="TOTAL_REVENUE", name="Total Revenue", category="Financial", unit="currency", description="Gross revenue generated from confirmed and completed bookings", target_type="higher_is_better"),
            KPIDefinition(code="NUM_BOOKINGS", name="Number of Bookings", category="Operations", unit="number", description="Total volume of guest bookings scheduled across all tours", target_type="higher_is_better"),
            KPIDefinition(code="CUSTOMER_ACQUISITION", name="Customer Acquisition", category="Customer", unit="number", description="Total registered customer guest profiles managed in the CRM", target_type="higher_is_better"),
            KPIDefinition(code="CONVERSION_RATE", name="Booking Conversion Rate", category="Marketing", unit="percentage", description="Percentage of inquiry leads converted into actual bookings", target_type="higher_is_better"),
            KPIDefinition(code="CANCELLATION_RATE", name="Cancellation Rate", category="Operations", unit="percentage", description="Percentage of bookings cancelled prior to departure", target_type="lower_is_better"),
            KPIDefinition(code="AVG_BOOKING_VALUE", name="Average Booking Value", category="Financial", unit="currency", description="Average gross spend per confirmed reservation", target_type="higher_is_better"),
            KPIDefinition(code="CUSTOMER_SATISFACTION", name="Customer Satisfaction Score", category="Customer", unit="score", description="Average guest satisfaction rating on a 5-point scale", target_type="higher_is_better"),
            KPIDefinition(code="EXPERIENCE_PERFORMANCE", name="Experience Occupancy Performance", category="Operations", unit="percentage", description="Average capacity utilization percentage across offerings", target_type="higher_is_better"),
        ]
        db.add_all(kpi_defs)
        db.flush()

        # ==========================================
        # ORGANIZATION 1: Alpine & Azure Expeditions
        # ==========================================
        logger.info("Seeding Organization 1: Alpine & Azure Expeditions...")
        org1 = Organization(
            name="Alpine & Azure Expeditions",
            slug="alpine-expeditions",
            logo_url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=200&q=80",
            primary_color="#142B45",
            secondary_color="#2376A8",
            email="contact@alpineexpeditions.com",
            phone="+1 (555) 342-8901",
            website="https://www.alpineexpeditions.com",
            currency="USD",
            description="Premier operator of luxury alpine treks, coastal kayaking expeditions, and high-altitude adventures across Europe and North America."
        )
        db.add(org1)
        db.flush()

        admin1 = User(
            organization_id=org1.id,
            email="admin@alpineexpeditions.com",
            hashed_password=get_password_hash("AlpineAdmin123!"),
            full_name="Marcus Sterling (Lead Operations)",
            role="admin",
            avatar_url="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
            is_active=True
        )
        db.add(admin1)

        # Destinations for Org 1
        dests1 = [
            Destination(organization_id=org1.id, name="Swiss Alps & Zermatt", country="Switzerland", region="Valais", description="Iconic peaks, world-class alpine huts, and pristine glaciers beneath the Matterhorn.", image_url="https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=600&q=80", climate="Alpine / Mountain", best_season="June - September", is_featured=True),
            Destination(organization_id=org1.id, name="Amalfi Coast & Capri", country="Italy", region="Campania", description="Clifftop vistas, azure waters, lemon orchards, and historic coastal paths.", image_url="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80", climate="Mediterranean", best_season="May - October", is_featured=True),
            Destination(organization_id=org1.id, name="Banff & Lake Louise", country="Canada", region="Alberta", description="Glacial lakes, pine forests, and jagged Rocky Mountain wilderness.", image_url="https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=600&q=80", climate="Subarctic Mountain", best_season="Year-round", is_featured=False),
            Destination(organization_id=org1.id, name="Norwegian Fjords", country="Norway", region="Vestland", description="Deep sapphire fjords, tumbling waterfalls, and sheer mountain walls.", image_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80", climate="Maritime Nordic", best_season="May - August", is_featured=True),
        ]
        db.add_all(dests1)
        db.flush()

        # Experiences for Org 1 (8-10 diverse categories)
        exps1 = [
            Experience(organization_id=org1.id, destination_id=dests1[0].id, title="Matterhorn Glacier Trek & Alpine Sunset", category="Adventure Tourism", description="A guided high-elevation trek crossing the Gorner Glacier with panoramic vistas of the Matterhorn.", short_description="Glacier hike and fondue at 3,100 meters altitude.", price=480.0, duration_hours=7.0, duration_days=1, capacity=12, rating=4.9, reviews_count=42, image_url="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[1].id, title="Amalfi Coastal Sea Kayak & Hidden Grottoes", category="Beach Experiences", description="Paddle along vertical limestone sea cliffs, discover secluded sea caves, and swim in emerald waters.", short_description="Sea kayaking along cliffs with secluded cove picnic.", price=260.0, duration_hours=5.0, duration_days=1, capacity=10, rating=4.8, reviews_count=35, image_url="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[0].id, title="Zermatt Historical Heritage & Woodcraft Walk", category="Historical Tours", description="Discover century-old barn houses, learn mountaineering history at Matterhorn Museum, and hear pioneer lore.", short_description="Guided historical walking tour through old Valais architecture.", price=175.0, duration_hours=3.5, duration_days=1, capacity=16, rating=4.7, reviews_count=19, image_url="https://images.unsplash.com/photo-1527668752968-14dc70a27c95?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[1].id, title="Capri Lemongrove Gastronomy & Wine Pairing", category="Food and Culinary Experiences", description="Walk private clifftop lemon orchards, sample artisan limoncello, and savor fresh handmade pasta.", short_description="Exclusive lemon harvest and sommelier tasting luncheon.", price=340.0, duration_hours=4.5, duration_days=1, capacity=14, rating=5.0, reviews_count=28, image_url="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[2].id, title="Banff Wildlife Safari & Grizzly Bear Tracking", category="Nature and Wildlife", description="Travel through Bow Valley with seasoned naturalists spotting elk, bighorn sheep, and grizzlies.", short_description="Morning guided wildlife expedition with telephoto scopes.", price=395.0, duration_hours=6.0, duration_days=1, capacity=12, rating=4.9, reviews_count=51, image_url="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[3].id, title="Geirangerfjord Kayak & Seven Sisters Fall", category="Nature and Wildlife", description="Glide through calm emerald waters directly beneath dramatic cascading waterfalls of the fjord.", short_description="Fjord kayak exploration to Seven Sisters waterfall.", price=310.0, duration_hours=5.5, duration_days=1, capacity=10, rating=4.8, reviews_count=23, image_url="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[1].id, title="Positano Cliffside Architecture & Art Walk", category="City Sightseeing", description="Explore winding stairways, artisan ceramics studios, and scenic belvederes overlooking the sea.", short_description="Cultural stroll exploring pastel architecture and ateliers.", price=190.0, duration_hours=3.0, duration_days=1, capacity=15, rating=4.7, reviews_count=18, image_url="https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[0].id, title="Private Heli-Ski & Luxury Alpine Odyssey", category="Customized Travel Experiences", description="Bespoke private helicopter drops onto virgin snow fields followed by 5-star mountain chalet hospitality.", short_description="Tailor-made helicopter access ski adventure and chalet stay.", price=1850.0, duration_hours=8.0, duration_days=2, capacity=6, rating=5.0, reviews_count=14, image_url="https://images.unsplash.com/photo-1551698618-1dfe5d97d256?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org1.id, destination_id=dests1[2].id, title="Lake Louise Canoeing & Glacier Moraine Hike", category="Adventure Tourism", description="Paddle custom cedar canoes across turquoise glacial waters and trek to historic Plain of Six Glaciers teahouse.", short_description="Canoeing on Lake Louise and historic teahouse trek.", price=290.0, duration_hours=6.0, duration_days=1, capacity=14, rating=4.9, reviews_count=39, image_url="https://images.unsplash.com/photo-1503614472-8c93d56e92ce?auto=format&fit=crop&w=600&q=80"),
        ]
        db.add_all(exps1)
        db.flush()

        # Customers for Org 1 (18 realistic customers)
        cust_data_1 = [
            ("Eleanor", "Vance", "eleanor.vance@gmail.com", "+1-415-555-0101", "United States", "vip", 5.0, 4850.0, "Prefers private guides; gluten-free diet"),
            ("James", "Thornton", "james.thornton@skyline.co.uk", "+44-20-7946-0921", "United Kingdom", "returning", 4.8, 2400.0, "Avid landscape photographer"),
            ("Sophia", "Lindqvist", "sophia.l@nordictech.se", "+46-8-123-4567", "Sweden", "returning", 4.9, 1850.0, "Loves high-altitude routes"),
            ("Carlos", "Mendoza", "carlos.m@madridlaw.es", "+34-91-555-2345", "Spain", "returning", 5.0, 3100.0, "Requests Italian wine tasting on excursions"),
            ("Hannah", "Schmidt", "h.schmidt@berlin-design.de", "+49-30-8912-3456", "Germany", "new", 4.7, 720.0, "Interested in coastal paddling tours"),
            ("Liam", "O'Connor", "liam.oconnor@dublincapital.ie", "+353-1-496-0123", "Ireland", "new", 5.0, 960.0, "Traveling with spouse"),
            ("Claire", "Dubois", "claire.dubois@parisart.fr", "+33-1-4268-5555", "France", "returning", 4.9, 2150.0, "Prefers morning departures"),
            ("David", "Kowalski", "dkowalski@chicago-med.org", "+1-312-555-8890", "United States", "new", 4.6, 580.0, "First-time alpine hiker"),
            ("Olivia", "Chen", "olivia.chen@sydneytech.com.au", "+61-2-9876-5432", "Australia", "returning", 5.0, 3750.0, "Booked private heli-ski tour in 2025"),
            ("Mateo", "Rossi", "mateo.rossi@milanofin.it", "+39-02-5551-2345", "Italy", "returning", 4.8, 1420.0, "Prefers local Italian speaking guides"),
            ("Emma", "Watson-Hall", "emma.wh@oxfordalumni.org", "+44-1865-555019", "United Kingdom", "new", 4.9, 850.0, "Celebrating 10th wedding anniversary"),
            ("Lucas", "Van Der Bilt", "lucas.vdb@amsterdam.nl", "+31-20-555-9876", "Netherlands", "returning", 5.0, 2900.0, "Triathlon enthusiast; high endurance"),
            ("Chloe", "Martin", "chloe.martin@torontofood.ca", "+1-416-555-0987", "Canada", "new", 4.8, 680.0, "Food & culinary enthusiast"),
            ("Vikram", "Malhotra", "vikram.m@bombayholdings.in", "+91-22-2555-0144", "India", "vip", 5.0, 6200.0, "Always books luxury private vehicle transfers"),
            ("Astrid", "Nygard", "astrid.nygard@osloenergy.no", "+47-22-55-12-34", "Norway", "new", 4.7, 620.0, "Local fjord conservation supporter"),
            ("Benjamin", "Miller", "ben.miller@austininvest.com", "+1-512-555-3412", "United States", "returning", 4.9, 1980.0, "Enjoys Banff snowshoeing and kayaking"),
            ("Isabella", "Santos", "isabella.s@saopaulo.br", "+55-11-98765-4321", "Brazil", "new", 5.0, 960.0, "Planning multi-destination Europe honeymoon"),
            ("Julian", "Bauer", "julian.bauer@vienna-music.at", "+43-1-555-0812", "Austria", "returning", 4.8, 1750.0, "Interested in Zermatt heritage tours"),
        ]

        customers1 = []
        for fn, ln, em, ph, cty, ctype, sat, spend, notes in cust_data_1:
            cust = Customer(
                organization_id=org1.id,
                first_name=fn,
                last_name=ln,
                email=em,
                phone=ph,
                country=cty,
                customer_type=ctype,
                satisfaction_score=sat,
                lifetime_spend=spend,
                internal_notes=notes,
                created_at=datetime.now(timezone.utc) - timedelta(days=60)
            )
            customers1.append(cust)
        db.add_all(customers1)
        db.flush()

        # Bookings for Org 1 (24 realistic bookings)
        bookings1 = [
            # Recent & Confirmed
            Booking(booking_reference="BK-2026-101", organization_id=org1.id, customer_id=customers1[0].id, experience_id=exps1[7].id, booking_date=date(2026, 11, 15), participants_count=2, unit_price=1850.0, total_price=3700.0, status="Confirmed", payment_status="Paid", special_requests="Private helicopter transfer requested from Bern."),
            Booking(booking_reference="BK-2026-102", organization_id=org1.id, customer_id=customers1[1].id, experience_id=exps1[0].id, booking_date=date(2026, 11, 12), participants_count=2, unit_price=480.0, total_price=960.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-103", organization_id=org1.id, customer_id=customers1[3].id, experience_id=exps1[3].id, booking_date=date(2026, 11, 8), participants_count=4, unit_price=340.0, total_price=1360.0, status="Confirmed", payment_status="Paid", special_requests="Table with sea view for lemon orchard tasting."),
            Booking(booking_reference="BK-2026-104", organization_id=org1.id, customer_id=customers1[4].id, experience_id=exps1[1].id, booking_date=date(2026, 11, 19), participants_count=2, unit_price=260.0, total_price=520.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-105", organization_id=org1.id, customer_id=customers1[5].id, experience_id=exps1[4].id, booking_date=date(2026, 11, 22), participants_count=2, unit_price=395.0, total_price=790.0, status="Pending", payment_status="Unpaid"),
            Booking(booking_reference="BK-2026-106", organization_id=org1.id, customer_id=customers1[8].id, experience_id=exps1[5].id, booking_date=date(2026, 11, 26), participants_count=3, unit_price=310.0, total_price=930.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-107", organization_id=org1.id, customer_id=customers1[13].id, experience_id=exps1[7].id, booking_date=date(2026, 12, 5), participants_count=2, unit_price=1850.0, total_price=3700.0, status="Confirmed", payment_status="Paid", special_requests="VIP airport welcome and sommelier dinner."),
            Booking(booking_reference="BK-2026-108", organization_id=org1.id, customer_id=customers1[15].id, experience_id=exps1[8].id, booking_date=date(2026, 11, 18), participants_count=2, unit_price=290.0, total_price=580.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-109", organization_id=org1.id, customer_id=customers1[16].id, experience_id=exps1[6].id, booking_date=date(2026, 11, 14), participants_count=2, unit_price=190.0, total_price=380.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-110", organization_id=org1.id, customer_id=customers1[7].id, experience_id=exps1[0].id, booking_date=date(2026, 11, 29), participants_count=1, unit_price=480.0, total_price=480.0, status="Pending", payment_status="Unpaid"),

            # Completed Bookings (with ratings)
            Booking(booking_reference="BK-2026-081", organization_id=org1.id, customer_id=customers1[2].id, experience_id=exps1[0].id, booking_date=date(2026, 10, 24), participants_count=2, unit_price=480.0, total_price=960.0, status="Completed", payment_status="Paid", feedback_rating=5.0, feedback_comment="Breathtaking glacier views. The guide was knowledgeable and safety conscious."),
            Booking(booking_reference="BK-2026-082", organization_id=org1.id, customer_id=customers1[6].id, experience_id=exps1[1].id, booking_date=date(2026, 10, 18), participants_count=2, unit_price=260.0, total_price=520.0, status="Completed", payment_status="Paid", feedback_rating=4.9, feedback_comment="Wonderful experience paddling through Capri grottos!"),
            Booking(booking_reference="BK-2026-083", organization_id=org1.id, customer_id=customers1[9].id, experience_id=exps1[2].id, booking_date=date(2026, 10, 14), participants_count=3, unit_price=175.0, total_price=525.0, status="Completed", payment_status="Paid", feedback_rating=4.8, feedback_comment="Deeply educational tour through Zermatt pioneer houses."),
            Booking(booking_reference="BK-2026-084", organization_id=org1.id, customer_id=customers1[11].id, experience_id=exps1[4].id, booking_date=date(2026, 10, 9), participants_count=2, unit_price=395.0, total_price=790.0, status="Completed", payment_status="Paid", feedback_rating=5.0, feedback_comment="We saw three grizzly bears safely from the trail! Remarkable guide."),
            Booking(booking_reference="BK-2026-085", organization_id=org1.id, customer_id=customers1[12].id, experience_id=exps1[3].id, booking_date=date(2026, 10, 2), participants_count=2, unit_price=340.0, total_price=680.0, status="Completed", payment_status="Paid", feedback_rating=5.0, feedback_comment="The freshly made pasta and lemon tart were divine."),
            Booking(booking_reference="BK-2026-086", organization_id=org1.id, customer_id=customers1[14].id, experience_id=exps1[5].id, booking_date=date(2026, 9, 28), participants_count=2, unit_price=310.0, total_price=620.0, status="Completed", payment_status="Paid", feedback_rating=4.7, feedback_comment="Incredible mist and power from the waterfalls."),
            Booking(booking_reference="BK-2026-087", organization_id=org1.id, customer_id=customers1[17].id, experience_id=exps1[8].id, booking_date=date(2026, 9, 21), participants_count=2, unit_price=290.0, total_price=580.0, status="Completed", payment_status="Paid", feedback_rating=4.9, feedback_comment="Turquoise water and quiet teahouse atop the glacier."),

            # Cancelled Bookings (to demonstrate realistic metrics)
            Booking(booking_reference="BK-2026-070", organization_id=org1.id, customer_id=customers1[5].id, experience_id=exps1[0].id, booking_date=date(2026, 10, 11), participants_count=2, unit_price=480.0, total_price=960.0, status="Cancelled", payment_status="Refunded", special_requests="Cancelled due to alpine weather advisory."),
            Booking(booking_reference="BK-2026-071", organization_id=org1.id, customer_id=customers1[10].id, experience_id=exps1[1].id, booking_date=date(2026, 9, 15), participants_count=2, unit_price=260.0, total_price=520.0, status="Cancelled", payment_status="Refunded"),
        ]
        db.add_all(bookings1)
        db.commit()

        # CRM Leads for Org 1 (8 realistic inquiries)
        leads1 = [
            Lead(organization_id=org1.id, name="Victoria Sterling", email="victoria.sterling@london.com", phone="+44-20-8910-1122", inquiry_text="Interested in booking Matterhorn Glacier trek for 4 corporate executives in December.", source="Website Inquiry", status="Interested", interested_category="Adventure Tourism", interested_experience_id=exps1[0].id, estimated_value=1920.0, assigned_to="Marcus Sterling"),
            Lead(organization_id=org1.id, name="Lucas Morel", email="lucas.morel@lyontech.fr", phone="+33-4-7890-1234", inquiry_text="Do you provide private sea kayak guides along Amalfi for photographers?", source="Social Media", status="Contacted", interested_category="Beach Experiences", interested_experience_id=exps1[1].id, estimated_value=520.0, assigned_to="Marcus Sterling"),
            Lead(organization_id=org1.id, name="Harper Reed", email="harper.reed@seattletravel.org", phone="+1-206-555-8790", inquiry_text="Looking for a 3-day custom Rocky Mountain hiking itinerary in Banff.", source="Travel Agent Referral", status="Converted", interested_category="Customized Travel Experiences", estimated_value=2400.0, customer_id=customers1[0].id),
            Lead(organization_id=org1.id, name="Takeshi Yamamoto", email="yamamoto@tokyo-arch.jp", phone="+81-3-5555-9870", inquiry_text="Requesting information on seasonal availability of Norwegian fjord excursions.", source="Website Inquiry", status="New", interested_category="Nature and Wildlife", interested_experience_id=exps1[5].id, estimated_value=930.0),
            Lead(organization_id=org1.id, name="Elena Gomez", email="elena.gomez@bogota.co", phone="+57-1-456-7890", inquiry_text="Would like private sommelier lemon orchard tasting for family reunion.", source="Partner Campaign", status="Interested", interested_category="Food and Culinary Experiences", interested_experience_id=exps1[3].id, estimated_value=1700.0),
            Lead(organization_id=org1.id, name="Simon Becker", email="simon.becker@zurich-it.ch", phone="+41-44-555-4321", inquiry_text="Checking if weekend tours to Zermatt heritage museum include transportation.", source="Phone / Direct", status="Lost", interested_category="Historical Tours", estimated_value=350.0),
        ]
        db.add_all(leads1)
        db.commit()

        # Customer Interactions for Org 1
        interactions1 = [
            CustomerInteraction(organization_id=org1.id, customer_id=customers1[0].id, user_id=admin1.id, interaction_type="Meeting", subject="Helicopter Transfer Briefing", notes="Met virtually to finalize helipad coordinates at Zermatt and custom luggage handling.", outcome="Confirmed"),
            CustomerInteraction(organization_id=org1.id, customer_id=customers1[1].id, user_id=admin1.id, interaction_type="Call", subject="Glacier Photography Gear Check", notes="Advised on cold weather lens protection and tripod guidelines for Gorner Glacier.", outcome="Satisfied"),
            CustomerInteraction(organization_id=org1.id, customer_id=customers1[3].id, user_id=admin1.id, interaction_type="Email", subject="Capri Menu Dietary Confirmation", notes="Guest confirmed seafood preferences and sommelier selection.", outcome="Preferences Saved"),
            CustomerInteraction(organization_id=org1.id, customer_id=customers1[13].id, user_id=admin1.id, interaction_type="Call", subject="VIP Luxury Chalet Amenities", notes="Arranged private chef for chalet stay following heli-ski adventure.", outcome="Arranged"),
            CustomerInteraction(organization_id=org1.id, customer_id=customers1[2].id, user_id=admin1.id, interaction_type="Feedback", subject="Post-tour Review Follow-up", notes="Guest gave 5-star rating and requested early notification for summer 2027 expeditions.", outcome="VIP Lead"),
        ]
        db.add_all(interactions1)
        db.commit()

        # Itinerary for Org 1
        itin1 = Itinerary(
            organization_id=org1.id,
            booking_id=bookings1[0].id,
            title="Matterhorn Apex & Glacier Odyssey",
            description="3-day bespoke high-alpine traverse featuring glacier trekking, panoramic helicopter flight, and luxury Valais culinary dinners.",
            start_date=date(2026, 11, 15),
            end_date=date(2026, 11, 17),
            is_custom=True
        )
        db.add(itin1)
        db.commit()

        activities1 = [
            ItineraryActivity(itinerary_id=itin1.id, day_number=1, scheduled_time="09:00 AM", activity_name="Zermatt Valley Arrival & Gear Fitting", description="Meet lead mountain guide at Grand Hotel Zermatterhof for technical crampon and harness check.", duration="2 hours", destination_id=dests1[0].id),
            ItineraryActivity(itinerary_id=itin1.id, day_number=1, scheduled_time="01:30 PM", activity_name="Gornergrat Scenic Railway Ascent", description="Ascend Europe's highest open-air cogwheel railway to 3,089 meters with vistas of 29 peaks.", duration="3 hours", destination_id=dests1[0].id),
            ItineraryActivity(itinerary_id=itin1.id, day_number=2, scheduled_time="08:30 AM", activity_name="Gorner Glacier Traverse Trek", description="High-elevation guided glacier crossing over ice crevasses and glacial pools.", duration="6 hours", experience_id=exps1[0].id, destination_id=dests1[0].id),
            ItineraryActivity(itinerary_id=itin1.id, day_number=3, scheduled_time="11:00 AM", activity_name="Private Helicopter Matterhorn Flyby & Fondue", description="Private helicopter flight skirting the Matterhorn North Face landing on high mountain plateau.", duration="4 hours", experience_id=exps1[7].id, destination_id=dests1[0].id),
        ]
        db.add_all(activities1)

        # Workflows for Org 1 (all 5 core requirements)
        workflows1 = [
            Workflow(organization_id=org1.id, name="Inquiry to CRM Auto-Capture", trigger_event="new_inquiry", description="Automatically captures incoming web inquiries, creates an active CRM lead, and alerts operations staff.", action_type="create_crm_record", is_enabled=True, execution_count=28, last_executed_at=datetime.now(timezone.utc) - timedelta(hours=3)),
            Workflow(organization_id=org1.id, name="Booking Confirmation Dispatch", trigger_event="new_booking", description="Generates verified booking confirmation vouchers, calculates totals, and logs guest itinerary link.", action_type="booking_confirmation_notification", is_enabled=True, execution_count=24, last_executed_at=datetime.now(timezone.utc) - timedelta(hours=14)),
            Workflow(organization_id=org1.id, name="Upcoming Experience Guide Reminder", trigger_event="upcoming_experience", description="Sends 48-hour pre-departure operational reminder to mountain guides and guest concierge team.", action_type="experience_reminder", is_enabled=True, execution_count=19, last_executed_at=datetime.now(timezone.utc) - timedelta(days=1)),
            Workflow(organization_id=org1.id, name="Post-Tour Satisfaction Feedback Survey", trigger_event="completed_experience", description="Dispatches automated digital survey link to guests upon completion of their tour.", action_type="feedback_request", is_enabled=True, execution_count=17, last_executed_at=datetime.now(timezone.utc) - timedelta(days=2)),
            Workflow(organization_id=org1.id, name="Unanswered Inquiry SLA Alert", trigger_event="unanswered_inquiry", description="Flags unaddressed customer leads exceeding 48 hours and raises high-priority task in CRM.", action_type="followup_task", is_enabled=True, execution_count=6, last_executed_at=datetime.now(timezone.utc) - timedelta(days=4)),
        ]
        db.add_all(workflows1)
        db.flush()

        # Workflow Executions history for Org 1
        wf_execs1 = [
            WorkflowExecution(workflow_id=workflows1[0].id, organization_id=org1.id, trigger_data='{"name": "Victoria Sterling", "source": "Website"}', status="SUCCESS", execution_message="Created CRM lead and customer interaction alert for Victoria Sterling.", executed_at=datetime.now(timezone.utc) - timedelta(hours=3)),
            WorkflowExecution(workflow_id=workflows1[1].id, organization_id=org1.id, trigger_data='{"ref": "BK-2026-101", "total": 3700.0}', status="SUCCESS", execution_message="Booking BK-2026-101 confirmed for Eleanor Vance. Digital confirmation voucher generated.", executed_at=datetime.now(timezone.utc) - timedelta(hours=14)),
            WorkflowExecution(workflow_id=workflows1[2].id, organization_id=org1.id, trigger_data='{"tour": "Matterhorn Glacier Trek"}', status="SUCCESS", execution_message="Sent departure reminder for Matterhorn Glacier Trek to lead guide Marcus.", executed_at=datetime.now(timezone.utc) - timedelta(days=1)),
            WorkflowExecution(workflow_id=workflows1[3].id, organization_id=org1.id, trigger_data='{"ref": "BK-2026-081"}', status="SUCCESS", execution_message="Feedback survey dispatched to Sophia Lindqvist. 5.0 score recorded.", executed_at=datetime.now(timezone.utc) - timedelta(days=2)),
            WorkflowExecution(workflow_id=workflows1[4].id, organization_id=org1.id, trigger_data='{"lead": "Simon Becker", "days": 3}', status="SUCCESS", execution_message="Escalated pending inquiry from Simon Becker into urgent task.", executed_at=datetime.now(timezone.utc) - timedelta(days=4)),
        ]
        db.add_all(wf_execs1)

        # Historical KPI Records for Org 1 (Past 6 Months)
        historical_months = [
            ("Jun 2026", date(2026, 6, 1), 18450.0, 18000.0, 16, 12, 4.8),
            ("Jul 2026", date(2026, 7, 1), 24800.0, 22000.0, 21, 18, 4.9),
            ("Aug 2026", date(2026, 8, 1), 31400.0, 28000.0, 28, 22, 4.9),
            ("Sep 2026", date(2026, 9, 1), 28950.0, 27000.0, 24, 19, 4.8),
            ("Oct 2026", date(2026, 10, 1), 35200.0, 32000.0, 31, 26, 4.9),
            ("Nov 2026", date(2026, 11, 1), 26850.0, 35000.0, 24, 18, 4.9),
        ]
        for label, m_date, rev, rev_target, bookings_cnt, cust_cnt, sat in historical_months:
            # Revenue record
            db.add(KPIRecord(organization_id=org1.id, kpi_definition_id=kpi_defs[0].id, period_date=m_date, period_label=label, actual_value=rev, target_value=rev_target, growth_rate=14.2, source="system_calculated"))
            # Bookings record
            db.add(KPIRecord(organization_id=org1.id, kpi_definition_id=kpi_defs[1].id, period_date=m_date, period_label=label, actual_value=bookings_cnt, target_value=float(bookings_cnt + 4), growth_rate=12.5, source="system_calculated"))
            # Customer acquisition
            db.add(KPIRecord(organization_id=org1.id, kpi_definition_id=kpi_defs[2].id, period_date=m_date, period_label=label, actual_value=cust_cnt, target_value=float(cust_cnt + 3), growth_rate=10.0, source="system_calculated"))

        # KPI Targets for Org 1 (Nov 2026)
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[0].id, period_type="monthly", period_identifier="2026-11", target_value=35000.0))
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[1].id, period_type="monthly", period_identifier="2026-11", target_value=28.0))
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[2].id, period_type="monthly", period_identifier="2026-11", target_value=20.0))
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[3].id, period_type="monthly", period_identifier="2026-11", target_value=35.0))
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[4].id, period_type="monthly", period_identifier="2026-11", target_value=5.0))
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[5].id, period_type="monthly", period_identifier="2026-11", target_value=1100.0))
        db.add(KPITarget(organization_id=org1.id, kpi_definition_id=kpi_defs[6].id, period_type="monthly", period_identifier="2026-11", target_value=4.8))

        # Sample Generated Reports for Org 1
        reports1 = [
            Report(organization_id=org1.id, title="Q3 2026 Comprehensive Performance Summary", report_type="Monthly Performance Report", period_start=date(2026, 7, 1), period_end=date(2026, 9, 30), file_format="PDF", file_size=42800, generated_by="Marcus Sterling"),
            Report(organization_id=org1.id, title="October 2026 Revenue & Margin Audit", report_type="Revenue Analytics Report", period_start=date(2026, 10, 1), period_end=date(2026, 10, 31), file_format="EXCEL", file_size=19400, generated_by="Marcus Sterling"),
        ]
        db.add_all(reports1)

        # Notifications for Org 1
        notifs1 = [
            Notification(organization_id=org1.id, title="New High-Value Booking Confirmed", message="Eleanor Vance booked 'Private Heli-Ski & Luxury Alpine Odyssey' ($3,700.00).", notification_type="booking", link="/bookings"),
            Notification(organization_id=org1.id, title="Customer Inquiry Received", message="Victoria Sterling submitted an inquiry for Matterhorn Glacier Trek (4 guests).", notification_type="inquiry", link="/crm"),
            Notification(organization_id=org1.id, title="Monthly Target Achieved", message="October 2026 gross revenue surpassed target by +10.0%.", notification_type="success", link="/kpis"),
        ]
        db.add_all(notifs1)

        # ==========================================
        # ORGANIZATION 2: Heritage & Horizon Journeys
        # ==========================================
        logger.info("Seeding Organization 2: Heritage & Horizon Journeys...")
        org2 = Organization(
            name="Heritage & Horizon Journeys",
            slug="heritage-horizon",
            logo_url="https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=200&q=80",
            primary_color="#1b3a5d",
            secondary_color="#27A69A",
            email="contact@heritagehorizon.com",
            phone="+44 (20) 7946-0811",
            website="https://www.heritagehorizon.com",
            currency="EUR",
            description="Specialists in immersive cultural heritage, culinary journeys, and historical archaeological expeditions across the Mediterranean and Asia."
        )
        db.add(org2)
        db.flush()

        admin2 = User(
            organization_id=org2.id,
            email="admin@heritagehorizon.com",
            hashed_password=get_password_hash("HeritageAdmin123!"),
            full_name="Dr. Julian Ross (Cultural Director)",
            role="admin",
            avatar_url="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
            is_active=True
        )
        db.add(admin2)

        # Destinations for Org 2
        dests2 = [
            Destination(organization_id=org2.id, name="Kyoto Ancient Temples", country="Japan", region="Kansai", description="Zen stone gardens, centuries-old shrines, bamboo groves, and traditional tea houses.", image_url="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80", climate="Temperate", best_season="March - May / Oct - Nov", is_featured=True),
            Destination(organization_id=org2.id, name="Athens & Peloponnese", country="Greece", region="Attica", description="Cradle of Western civilization, ancient amphitheatres, and olive grove villages.", image_url="https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=600&q=80", climate="Mediterranean", best_season="April - June", is_featured=True),
            Destination(organization_id=org2.id, name="Andalusia & Granada", country="Spain", region="Andalusia", description="Moorish palatial architecture, flamenco heritage, and historic Jewish quarters.", image_url="https://images.unsplash.com/photo-1566836610593-61a3f1b40280?auto=format&fit=crop&w=600&q=80", climate="Warm Mediterranean", best_season="March - June", is_featured=False),
        ]
        db.add_all(dests2)
        db.flush()

        # Experiences for Org 2 (8 experiences)
        exps2 = [
            Experience(organization_id=org2.id, destination_id=dests2[0].id, title="Kyoto Zen Gardens & Traditional Tea Ceremony", category="Cultural Tourism", description="Step through ancient bamboo paths and experience a private 16th-century tea ritual with an authentic tea master.", short_description="Private tea master ritual in a serene UNESCO garden.", price=220.0, duration_hours=4.0, capacity=12, rating=4.9, reviews_count=48, image_url="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[1].id, title="Acropolis Private Archaeological Twilight Tour", category="Historical Tours", description="Walk the Parthenon and Dionysus Theatre after public gates close accompanied by an archaeologist.", short_description="Exclusive after-hours Parthenon walking tour.", price=290.0, duration_hours=3.5, capacity=15, rating=5.0, reviews_count=62, image_url="https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[2].id, title="Alhambra Palaces & Moorish Garden Evening", category="Historical Tours", description="Discover intricate arabesque stuccos and fragrant Generalife fountain courtyards under starlight.", short_description="Starlight tour of the Nasrid Palaces and Generalife.", price=240.0, duration_hours=4.0, capacity=14, rating=4.9, reviews_count=36, image_url="https://images.unsplash.com/photo-1566836610593-61a3f1b40280?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[0].id, title="Kyoto Kaiseki Culinary Masterclass & Market Tour", category="Food and Culinary Experiences", description="Browse Nishiki Market with a Michelin-starred chef, select fresh seasonal produce, and prepare 7-course kaiseki.", short_description="Chef-led market foraging and traditional kaiseki preparation.", price=360.0, duration_hours=5.5, capacity=10, rating=4.8, reviews_count=29, image_url="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[1].id, title="Peloponnese Ancient Olive Grove Harvest & Tasting", category="Food and Culinary Experiences", description="Visit 300-year-old family groves, press extra-virgin olive oil, and savor outdoor farm-to-table lunch.", short_description="Organic olive pressing and rustic Mediterranean luncheon.", price=180.0, duration_hours=5.0, capacity=16, rating=4.7, reviews_count=21, image_url="https://images.unsplash.com/photo-1473093295043-cdd812d0e601?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[2].id, title="Seville Historic Flamenco Heritage & Tapas Crawl", category="Cultural Tourism", description="Trace flamenco roots in Triana neighborhood followed by intimate tablao show and artisan tapas.", short_description="Historic flamenco performance and Triana tapas tasting.", price=195.0, duration_hours=4.0, capacity=14, rating=4.9, reviews_count=44, image_url="https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[0].id, title="Fushimi Inari Sunset Photography Walk", category="City Sightseeing", description="Hike past thousands of vibrant vermilion torii gates catching golden hour mountain views over Kyoto.", short_description="Guided evening photography stroll along torii gates.", price=140.0, duration_hours=3.0, capacity=12, rating=4.8, reviews_count=33, image_url="https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=600&q=80"),
            Experience(organization_id=org2.id, destination_id=dests2[1].id, title="Grand Classical Greece 4-Day Curated Odyssey", category="Customized Travel Experiences", description="Tailored private expedition connecting Athens, Delphi oracle sanctuary, and ancient Epidaurus.", short_description="4-day bespoke Classical Greece historical pilgrimage.", price=1650.0, duration_hours=9.0, duration_days=4, capacity=8, rating=5.0, reviews_count=16, image_url="https://images.unsplash.com/photo-1555993539-1732b0258235?auto=format&fit=crop&w=600&q=80"),
        ]
        db.add_all(exps2)
        db.flush()

        # Customers for Org 2 (16 customers)
        cust_data_2 = [
            ("Alistair", "Crawford", "alistair.crawford@edinburgh.ac.uk", "+44-131-496-0234", "United Kingdom", "vip", 5.0, 5200.0, "Professor of Classical Antiquity; requests specialized academic guides"),
            ("Margaret", "Sterling", "m.sterling@bostonarts.org", "+1-617-555-8910", "United States", "returning", 5.0, 3100.0, "Art historian, frequent traveler to Greece and Italy"),
            ("Kenji", "Takahashi", "kenji.takahashi@osaka-design.jp", "+81-6-5555-1234", "Japan", "returning", 4.9, 1750.0, "Architect fascinated by Andalusian Moorish geometry"),
            ("Helena", "Vasiliev", "helena.v@geneva-un.ch", "+41-22-555-9871", "Switzerland", "returning", 4.8, 2200.0, "Enjoys archaeological walking tours"),
            ("Patrick", "O'Reilly", "patrick.oreilly@dublinlaw.ie", "+353-1-555-4321", "Ireland", "new", 4.9, 880.0, "Booked Kyoto culinary masterclass"),
            ("Beatrice", "Fontaine", "beatrice.fontaine@sorbonne.fr", "+33-1-4567-8901", "France", "returning", 5.0, 2600.0, "Specializes in comparative religion and Zen gardens"),
            ("Robert", "Taylor", "robert.taylor@nyinvest.com", "+1-212-555-0987", "United States", "new", 4.7, 720.0, "Traveling with adult daughter"),
            ("Lucia", "Moretti", "lucia.moretti@roma-art.it", "+39-06-5551-7890", "Italy", "returning", 4.9, 1950.0, "Enjoys Spanish flamenco and Moorish heritage"),
            ("Siddharth", "Mehta", "siddharth.m@delhi-group.in", "+91-11-2555-6789", "India", "vip", 5.0, 6800.0, "Booked Grand Classical Greece 4-day private journey"),
            ("Ingrid", "Lindgren", "ingrid.lindgren@stockholm.se", "+46-8-555-3456", "Sweden", "new", 4.8, 660.0, "Attended olive harvest tasting"),
            ("Fernando", "Silva", "fernando.silva@lisbon.pt", "+351-21-555-0123", "Portugal", "returning", 4.9, 1450.0, "Loves Andalusian architecture"),
            ("Amara", "Okafor", "amara.okafor@lagos-creative.ng", "+234-1-555-7890", "Nigeria", "new", 5.0, 950.0, "Photography enthusiast"),
            ("Gregory", "White", "greg.white@melbourne.edu.au", "+61-3-9876-1122", "Australia", "returning", 4.8, 2100.0, "Historian, visited Acropolis tour"),
            ("Serena", "Kovacs", "serena.kovacs@budapest.hu", "+36-1-555-4321", "Hungary", "new", 4.9, 780.0, "Interested in Kyoto ceramic masterclasses"),
            ("Niels", "Jorgensen", "niels.j@copenhagen.dk", "+45-33-55-12-34", "Denmark", "returning", 4.7, 1350.0, "Enjoys evening walking tours"),
            ("Rachel", "Goldstein", "rachel.g@chicagophil.org", "+1-773-555-6789", "United States", "new", 5.0, 1100.0, "Solo traveler with passion for classical theatre"),
        ]

        customers2 = []
        for fn, ln, em, ph, cty, ctype, sat, spend, notes in cust_data_2:
            cust = Customer(
                organization_id=org2.id,
                first_name=fn,
                last_name=ln,
                email=em,
                phone=ph,
                country=cty,
                customer_type=ctype,
                satisfaction_score=sat,
                lifetime_spend=spend,
                internal_notes=notes,
                created_at=datetime.now(timezone.utc) - timedelta(days=50)
            )
            customers2.append(cust)
        db.add_all(customers2)
        db.flush()

        # Bookings for Org 2 (20 realistic bookings)
        bookings2 = [
            Booking(booking_reference="BK-2026-201", organization_id=org2.id, customer_id=customers2[8].id, experience_id=exps2[7].id, booking_date=date(2026, 11, 16), participants_count=2, unit_price=1650.0, total_price=3300.0, status="Confirmed", payment_status="Paid", special_requests="Private archaeological professor guide throughout."),
            Booking(booking_reference="BK-2026-2026", organization_id=org2.id, customer_id=customers2[0].id, experience_id=exps2[1].id, booking_date=date(2026, 11, 10), participants_count=2, unit_price=290.0, total_price=580.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-203", organization_id=org2.id, customer_id=customers2[4].id, experience_id=exps2[3].id, booking_date=date(2026, 11, 18), participants_count=2, unit_price=360.0, total_price=720.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-204", organization_id=org2.id, customer_id=customers2[1].id, experience_id=exps2[2].id, booking_date=date(2026, 11, 24), participants_count=2, unit_price=240.0, total_price=480.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-205", organization_id=org2.id, customer_id=customers2[9].id, experience_id=exps2[4].id, booking_date=date(2026, 11, 27), participants_count=3, unit_price=180.0, total_price=540.0, status="Pending", payment_status="Unpaid"),
            Booking(booking_reference="BK-2026-206", organization_id=org2.id, customer_id=customers2[5].id, experience_id=exps2[0].id, booking_date=date(2026, 11, 13), participants_count=2, unit_price=220.0, total_price=440.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-207", organization_id=org2.id, customer_id=customers2[11].id, experience_id=exps2[6].id, booking_date=date(2026, 11, 21), participants_count=1, unit_price=140.0, total_price=140.0, status="Confirmed", payment_status="Paid"),
            Booking(booking_reference="BK-2026-208", organization_id=org2.id, customer_id=customers2[7].id, experience_id=exps2[5].id, booking_date=date(2026, 11, 29), participants_count=2, unit_price=195.0, total_price=390.0, status="Confirmed", payment_status="Paid"),

            # Completed with ratings
            Booking(booking_reference="BK-2026-190", organization_id=org2.id, customer_id=customers2[2].id, experience_id=exps2[2].id, booking_date=date(2026, 10, 22), participants_count=2, unit_price=240.0, total_price=480.0, status="Completed", payment_status="Paid", feedback_rating=5.0, feedback_comment="Alhambra under starlight was magical. The guide's knowledge of Islamic architecture was peerless."),
            Booking(booking_reference="BK-2026-191", organization_id=org2.id, customer_id=customers2[3].id, experience_id=exps2[1].id, booking_date=date(2026, 10, 16), participants_count=2, unit_price=290.0, total_price=580.0, status="Completed", payment_status="Paid", feedback_rating=5.0, feedback_comment="Having the Acropolis completely to ourselves at sunset was unforgettable."),
            Booking(booking_reference="BK-2026-192", organization_id=org2.id, customer_id=customers2[6].id, experience_id=exps2[0].id, booking_date=date(2026, 10, 8), participants_count=2, unit_price=220.0, total_price=440.0, status="Completed", payment_status="Paid", feedback_rating=4.8, feedback_comment="The tea master provided serene insight into Zen mindfulness."),
            Booking(booking_reference="BK-2026-193", organization_id=org2.id, customer_id=customers2[12].id, experience_id=exps2[3].id, booking_date=date(2026, 10, 3), participants_count=2, unit_price=360.0, total_price=720.0, status="Completed", payment_status="Paid", feedback_rating=4.9, feedback_comment="Culinary highlight of our trip to Japan."),

            # Cancelled
            Booking(booking_reference="BK-2026-180", organization_id=org2.id, customer_id=customers2[10].id, experience_id=exps2[5].id, booking_date=date(2026, 10, 12), participants_count=2, unit_price=195.0, total_price=390.0, status="Cancelled", payment_status="Refunded"),
        ]
        db.add_all(bookings2)
        db.flush()

        # Workflows for Org 2
        workflows2 = [
            Workflow(organization_id=org2.id, name="Inquiry to CRM Auto-Capture", trigger_event="new_inquiry", description="Captures cultural inquiry submissions and auto-links academic customer profiles.", action_type="create_crm_record", is_enabled=True, execution_count=21, last_executed_at=datetime.now(timezone.utc) - timedelta(hours=6)),
            Workflow(organization_id=org2.id, name="Booking Confirmation Dispatch", trigger_event="new_booking", description="Dispatches cultural heritage confirmation dossier and reading list to registered guests.", action_type="booking_confirmation_notification", is_enabled=True, execution_count=20, last_executed_at=datetime.now(timezone.utc) - timedelta(hours=18)),
            Workflow(organization_id=org2.id, name="Historical Tour Guide Prep Notice", trigger_event="upcoming_experience", description="Alerts guest lecturer and museum curator of upcoming tour group demographics.", action_type="experience_reminder", is_enabled=True, execution_count=16, last_executed_at=datetime.now(timezone.utc) - timedelta(days=2)),
            Workflow(organization_id=org2.id, name="Post-Tour Satisfaction Feedback Survey", trigger_event="completed_experience", description="Solicits academic and hospitality feedback from tour participants.", action_type="feedback_request", is_enabled=True, execution_count=14, last_executed_at=datetime.now(timezone.utc) - timedelta(days=3)),
            Workflow(organization_id=org2.id, name="Unanswered Inquiry SLA Alert", trigger_event="unanswered_inquiry", description="Monitors incoming museum inquiries and prevents unaddressed requests.", action_type="followup_task", is_enabled=True, execution_count=4, last_executed_at=datetime.now(timezone.utc) - timedelta(days=5)),
        ]
        db.add_all(workflows2)
        db.flush()

        # Historical KPI Records for Org 2
        hist_months_2 = [
            ("Jun 2026", date(2026, 6, 1), 15200.0, 14000.0, 14, 11),
            ("Jul 2026", date(2026, 7, 1), 21300.0, 19000.0, 19, 15),
            ("Aug 2026", date(2026, 8, 1), 26800.0, 24000.0, 24, 19),
            ("Sep 2026", date(2026, 9, 1), 24100.0, 23000.0, 20, 16),
            ("Oct 2026", date(2026, 10, 1), 29500.0, 27000.0, 25, 21),
            ("Nov 2026", date(2026, 11, 1), 21800.0, 28000.0, 18, 16),
        ]
        for label, m_date, rev, rev_target, bookings_cnt, cust_cnt in hist_months_2:
            db.add(KPIRecord(organization_id=org2.id, kpi_definition_id=kpi_defs[0].id, period_date=m_date, period_label=label, actual_value=rev, target_value=rev_target, growth_rate=11.8, source="system_calculated"))
            db.add(KPIRecord(organization_id=org2.id, kpi_definition_id=kpi_defs[1].id, period_date=m_date, period_label=label, actual_value=bookings_cnt, target_value=float(bookings_cnt + 3), growth_rate=10.5, source="system_calculated"))

        # KPI Targets for Org 2
        db.add(KPITarget(organization_id=org2.id, kpi_definition_id=kpi_defs[0].id, period_type="monthly", period_identifier="2026-11", target_value=28000.0))
        db.add(KPITarget(organization_id=org2.id, kpi_definition_id=kpi_defs[1].id, period_type="monthly", period_identifier="2026-11", target_value=24.0))
        db.add(KPITarget(organization_id=org2.id, kpi_definition_id=kpi_defs[2].id, period_type="monthly", period_identifier="2026-11", target_value=18.0))

        # Leads for Org 2
        leads2 = [
            Lead(organization_id=org2.id, name="Lady Caroline Howard", email="caroline.howard@cotswolds.uk", phone="+44-1608-555123", inquiry_text="Seeking private after-hours Parthenon visit for archaeological society members.", source="Website Inquiry", status="Interested", interested_category="Historical Tours", interested_experience_id=exps2[1].id, estimated_value=1450.0),
            Lead(organization_id=org2.id, name="Jonathan Adler", email="j.adler@nyu.edu", phone="+1-212-555-4567", inquiry_text="Inquiring about masterclass availability in Kyoto for next spring.", source="Travel Agent Referral", status="New", interested_category="Food and Culinary Experiences", interested_experience_id=exps2[3].id, estimated_value=720.0),
        ]
        db.add_all(leads2)

        # Notifications for Org 2
        notifs2 = [
            Notification(organization_id=org2.id, title="Bespoke Classical Tour Booked", message="Siddharth Mehta confirmed 'Grand Classical Greece 4-Day Curated Odyssey' (€3,300.00).", notification_type="booking", link="/bookings"),
            Notification(organization_id=org2.id, title="Archaeological Inquiry Logged", message="Lady Caroline Howard submitted request for Acropolis twilight visit.", notification_type="inquiry", link="/crm"),
        ]
        db.add_all(notifs2)

        db.commit()
        logger.info("Successfully seeded all realistic tourism demonstration data!")

    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        db.rollback()
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
