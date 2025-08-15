import os
import pymongo
from services.data_query.data_query_service import DataQueryService, DataQueryCatalog
from services.data_query.data_query_connection_service import SupersetConnectionService
from dotenv import load_dotenv

load_dotenv(dotenv_path="../../../compose-files/secrets.env")


def verify_mongo_credentials(mongo_host, mongo_port, username, password):
    print("--- STEP 0: Verifying MongoDB Credentials ---")
    try:
        client = pymongo.MongoClient(
            mongo_host,
            mongo_port,
            username=username,
            password=password,
            authSource="admin",
            serverSelectionTimeoutMS=5000,
        )
        client.admin.command("ismaster")
        print("MongoDB credentials verified successfully.")
        client.close()
        return True
    except pymongo.errors.OperationFailure:
        print("\nCRITICAL ERROR: The MongoDB password is incorrect.")
        print("Please correct the MONGO_PASS variable in the script and try again.")
        return False
    except Exception as e:
        print("\nCRITICAL ERROR: Could not connect to MongoDB.")
        print(f"Details: {e}")
        return False


def populate_mongo_with_sample_data(
    mongo_host, mongo_port, db_name, username, password
):
    print(
        f"Connecting to MongoDB at {mongo_host}:{mongo_port} with user '{username}'..."
    )
    try:
        client = pymongo.MongoClient(
            mongo_host,
            mongo_port,
            username=username,
            password=password,
            authSource="admin",
        )
        db = client[db_name]
        collection = db["sales_reports"]
        collection.delete_many({})
        sample_data = [
            {"product": "Laptop", "revenue": 4500, "region": "North"},
            {"product": "Phone", "revenue": 8000, "region": "South"},
            {"product": "Tablet", "revenue": 6200, "region": "East"},
            {"product": "Monitor", "revenue": 3100, "region": "West"},
        ]
        collection.insert_many(sample_data)
        print(f"Sample data inserted into '{collection.name}' collection.")
        client.close()
    except Exception as e:
        print(f"Error populating MongoDB: {e}")


def cleanup_mongo_data(mongo_host, mongo_port, db_name, username, password):
    print(f"Deleting test database '{db_name}' from MongoDB...")
    try:
        client = pymongo.MongoClient(
            mongo_host,
            mongo_port,
            username=username,
            password=password,
            authSource="admin",
        )
        client.drop_database(db_name)
        client.close()
        print("MongoDB test database successfully removed.")
    except Exception as e:
        print(f"Error cleaning up MongoDB: {e}")


def main():
    print("Starting full integration test...")

    TRINO_USER = "test"
    MONGO_HOST = "localhost"
    MONGO_PORT = 27017
    CATALOG_NAME = "sales_mongo_e2e"
    MONGO_USER = os.getenv("DATA_STORAGE_MONGODB_ROOT_USERNAME")
    MONGO_PASS = os.getenv("DATA_STORAGE_MONGODB_ROOT_PASSWORD")

    if not verify_mongo_credentials(MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASS):
        print("\nProcess stopped due to configuration error.")
        return

    trino_service = DataQueryService(host="localhost", port=8082)
    superset_service = SupersetConnectionService()

    mongodb_catalog_obj = DataQueryCatalog.build_mongodb_catalog(
        CATALOG_NAME, MONGO_HOST, MONGO_PORT, MONGO_USER, MONGO_PASS
    )

    created_trino_catalog = None
    created_superset_connection = None

    try:
        print(f"\n--- STEP 1: Creating Trino Catalog '{CATALOG_NAME}' ---")
        created_trino_catalog = trino_service.create_catalog(
            TRINO_USER, mongodb_catalog_obj
        )
        if created_trino_catalog:
            print(
                f"Catalog '{created_trino_catalog.name}' created successfully in Trino."
            )

        print("\n--- STEP 2: Inserting sample data into MongoDB ---")
        populate_mongo_with_sample_data(
            MONGO_HOST, MONGO_PORT, CATALOG_NAME, MONGO_USER, MONGO_PASS
        )

        print(f"\n--- STEP 3: Creating Superset Connection for '{CATALOG_NAME}' ---")
        created_superset_connection = superset_service.add_trino_connection(
            CATALOG_NAME
        )
        if created_superset_connection:
            print(
                f"Connection '{created_superset_connection['result']['database_name']}' created successfully in Superset."
            )

        print("\nProcess finished. Press Enter to clean up resources...")
        input()

    except Exception as e:
        print(f"An error occurred during the process: {e}")

    finally:
        print("\n--- STEP 4: Cleaning up created resources ---")
        if created_superset_connection:
            superset_service.delete_connection(created_superset_connection["id"])
        if created_trino_catalog:
            trino_service.delete_catalog(TRINO_USER, created_trino_catalog)
        cleanup_mongo_data(MONGO_HOST, MONGO_PORT, CATALOG_NAME, MONGO_USER, MONGO_PASS)
        print("\nIntegration test finished.")


if __name__ == "__main__":
    main()
