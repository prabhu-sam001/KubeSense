from fastapi import APIRouter, Depends, Query
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from services.prometheus_service import PrometheusService
import database.db as db_mod
from models.metric_history import DBMetricHistory
import math

router = APIRouter(prefix="/api/metrics", tags=["metrics"])

# Service instantiation helper
def get_prometheus_service():
    return PrometheusService()

@router.get("/cpu")
async def get_cpu(service: PrometheusService = Depends(get_prometheus_service)):
    return await service.get_cpu_metrics()

@router.get("/memory")
async def get_memory(service: PrometheusService = Depends(get_prometheus_service)):
    return await service.get_memory_metrics()

@router.get("/storage")
async def get_storage(service: PrometheusService = Depends(get_prometheus_service)):
    return await service.get_storage_metrics()

@router.get("/pvc")
async def get_pvc(service: PrometheusService = Depends(get_prometheus_service)):
    return await service.get_pvc_metrics()

@router.get("/summary")
async def get_summary(service: PrometheusService = Depends(get_prometheus_service)):
    return await service.get_summary_metrics()

@router.get("/network")
async def get_network(service: PrometheusService = Depends(get_prometheus_service)):
    return await service.get_network_metrics()

@router.get("/history")
def get_metrics_history(
    timeframe: str = Query("15m", regex="^(5m|15m|1h|6h|24h)$"),
    metric: str = Query("all"),
    db: Session = Depends(db_mod.get_db)
):
    """
    Returns timestamped time-series metric history for Frontend, Backend, and Database
    across selectable timeframes (5m, 15m, 1h, 6h, 24h).
    """
    timeframe_map = {
        "5m": timedelta(minutes=5),
        "15m": timedelta(minutes=15),
        "1h": timedelta(hours=1),
        "6h": timedelta(hours=6),
        "24h": timedelta(hours=24)
    }
    
    delta = timeframe_map.get(timeframe, timedelta(minutes=15))
    cutoff = datetime.utcnow() - delta
    
    rows = (
        db.query(DBMetricHistory)
        .filter(DBMetricHistory.timestamp >= cutoff)
        .order_by(DBMetricHistory.timestamp.asc())
        .all()
    )
    
    # Group rows by bucketed timestamp
    # Resolution bucketing based on timeframe to optimize chart rendering
    bucket_seconds = 10
    if timeframe == "5m":
        bucket_seconds = 10
    elif timeframe == "15m":
        bucket_seconds = 15
    elif timeframe == "1h":
        bucket_seconds = 60
    elif timeframe == "6h":
        bucket_seconds = 300
    elif timeframe == "24h":
        bucket_seconds = 1200
        
    buckets = {}
    for r in rows:
        ts = r.timestamp
        # Round timestamp to bucket_seconds interval
        epoch = ts.timestamp()
        rounded_epoch = math.floor(epoch / bucket_seconds) * bucket_seconds
        bucket_dt = datetime.utcfromtimestamp(rounded_epoch)
        bucket_key = bucket_dt.strftime("%H:%M:%S" if delta <= timedelta(hours=6) else "%m-%d %H:%M")
        
        if bucket_key not in buckets:
            buckets[bucket_key] = {
                "timestamp": bucket_dt.isoformat() + "Z",
                "time": bucket_key,
                "frontend_cpu": 0,
                "backend_cpu": 0,
                "database_cpu": 0,
                "frontend_mem": 0.0,
                "backend_mem": 0.0,
                "database_mem": 0.0,
                "storage_pct": 35.0,
                "latency_ms": 12.0,
                "packet_loss_pct": 0.0,
            }
            
        svc = (r.service or "").lower()
        if "front" in svc:
            buckets[bucket_key]["frontend_cpu"] = r.cpu_millicores
            buckets[bucket_key]["frontend_mem"] = r.memory_mb
        elif "back" in svc:
            buckets[bucket_key]["backend_cpu"] = r.cpu_millicores
            buckets[bucket_key]["backend_mem"] = r.memory_mb
        elif "data" in svc or "post" in svc:
            buckets[bucket_key]["database_cpu"] = r.cpu_millicores
            buckets[bucket_key]["database_mem"] = r.memory_mb
            if r.storage_used_pct > 0:
                buckets[bucket_key]["storage_pct"] = r.storage_used_pct
                
        if r.latency_ms > 0:
            buckets[bucket_key]["latency_ms"] = r.latency_ms
        if r.packet_loss_pct > 0:
            buckets[bucket_key]["packet_loss_pct"] = r.packet_loss_pct
            
    history_points = list(buckets.values())
    
    # Calculate summary metadata
    latest_pt = history_points[-1] if history_points else None
    
    return {
        "timeframe": timeframe,
        "count": len(history_points),
        "data": history_points,
        "latest": latest_pt
    }
