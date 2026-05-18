# Azure Deployment Guide

This guide outlines the steps to deploy the AI-Powered Smart ATM System to Microsoft Azure for a production-grade cloud environment.

## 1. Prerequisites
- Active Azure Subscription.
- Azure CLI installed locally (`az login`).
- Docker installed locally.

## 2. Deploying Azure Database for PostgreSQL
Instead of using the local Docker Postgres container, provision a managed database.

1. In the Azure Portal, create a resource: **Azure Database for PostgreSQL - Flexible Server**.
2. Configure compute + storage (Burstable B1ms is sufficient for MVP).
3. Set the Administrator username and password.
4. **Networking**: Ensure you "Allow public access from any Azure service within Azure to this server". Add your local IP if you want to connect locally.
5. Get the connection string. It will look like:
   `postgresql://<user>:<password>@<server-name>.postgres.database.azure.com:5432/postgres`

## 3. Container Registry Setup (Azure Container Registry)
You need a place to store your Docker images.

1. Create a resource: **Container Registry** (Basic SKU).
2. Login to the registry via CLI:
   `az acr login --name <your-registry-name>`
3. Tag your local images:
   ```bash
   docker tag atm_backend <your-registry-name>.azurecr.io/atm-backend:v1
   docker tag atm_frontend <your-registry-name>.azurecr.io/atm-frontend:v1
   ```
4. Push images to ACR:
   ```bash
   docker push <your-registry-name>.azurecr.io/atm-backend:v1
   docker push <your-registry-name>.azurecr.io/atm-frontend:v1
   ```

## 4. Deploying the Backend (Azure App Service)
1. Create a resource: **Web App**.
2. Publish: **Docker Container**, Operating System: **Linux**.
3. In the Docker tab, select **Azure Container Registry** and pick your `atm-backend` image.
4. Once deployed, go to **Configuration** -> **Application settings** and add:
   - `DATABASE_URL` = Your Azure Postgres connection string.
   - `SECRET_KEY` = Your secure JWT key.
   - `WEBSITES_PORT` = `8000` (This tells Azure which port your container uses).

## 5. Deploying the Frontend (Azure Static Web Apps or App Service)
If your frontend is a static React build:
1. Run `npm run build` locally to generate the `/dist` folder.
2. Create a resource: **Azure Static Web Apps**.
3. Connect your GitHub repository.
4. Set the build preset to React and provide the API location if deploying the API together, or point to your deployed App Service URL.
5. **Alternative**: You can deploy the frontend Docker container exactly like the backend, just ensure `VITE_API_URL` environment variable points to the live backend URL.

## 6. Azure Blob Storage (Optional for Models)
To avoid packaging large `.pkl` files in the Docker container, use Blob Storage.
1. Create a **Storage Account** and a container named `models`.
2. Upload `cash_predictor.pkl`.
3. In the backend, use the `azure-storage-blob` python package to download the model at startup.
