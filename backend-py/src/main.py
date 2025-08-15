from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes.routes_loader import get_main_router
from config.alembic_upgrade import run_migrations

run_migrations()

app = FastAPI(
    title="EU LDT Data Platform API",
    version="1.0",
    description="The EU LDT Data Platform is a comprehensive solution designed to manage, integrate, and analyse contextual data across municipalities, enabling seamless connectivity between diverse data sources and systems. This platform serves as the backbone for data storage, ingestion, and processing, ensuring that information is accessible, standardized, and ready to be utilized in various applications such as decision-making, simulation, monitoring, and visualization. By leveraging cutting-edge technologies and adhering to NGSI-LD standards, the EU LDT Data Platform empowers stakeholders to efficiently handle the complexity of modern data ecosystems.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(get_main_router())
