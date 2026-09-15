from sqlalchemy import Column, Integer, Float, String, DateTime, Index
from datetime import datetime
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from database.db import Base

class DBMetricHistory(Base):
    __tablename__ = "metric_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    service = Column(String(50), index=True)       # 'frontend', 'backend', 'database', 'cluster'
    pod_name = Column(String(100), index=True)
    cpu_cores = Column(Float, default=0.0)         # Cores (e.g. 0.085)
    cpu_millicores = Column(Integer, default=0)    # Millicores (e.g. 85m)
    memory_mb = Column(Float, default=0.0)         # Memory in MiB
    storage_used_pct = Column(Float, default=0.0)  # PVC usage percentage (e.g. 35.5)
    latency_ms = Column(Float, default=0.0)        # Network latency (e.g. 12.4)
    packet_loss_pct = Column(Float, default=0.0)   # Packet drop rate %

    # Index on service + timestamp for fast time-series queries
    __table_args__ = (
        Index('idx_service_timestamp', 'service', 'timestamp'),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
            "time_label": self.timestamp.strftime("%H:%M:%S") if self.timestamp else "",
            "service": self.service,
            "pod_name": self.pod_name,
            "cpu_cores": self.cpu_cores,
            "cpu_millicores": self.cpu_millicores,
            "memory_mb": self.memory_mb,
            "storage_used_pct": self.storage_used_pct,
            "latency_ms": self.latency_ms,
            "packet_loss_pct": self.packet_loss_pct,
        }
