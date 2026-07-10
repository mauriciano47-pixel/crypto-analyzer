"""
Integración con fuentes de noticias cripto en tiempo real.
Utiliza feeds RSS públicos (CoinTelegraph, CoinDesk, CryptoNews)
que no requieren de API Keys para funcionar y ofrecen información fresca al instante.
"""
import xml.etree.ElementTree as ET
import requests
import urllib3
from datetime import datetime
import email.utils
from django.conf import settings
from ..models import NewsItem

# Deshabilitar advertencias de SSL inseguro para entornos detrás de proxies o con problemas de CA
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


def obtener_noticias_rss(asset_symbol: str, limite: int = 15) -> list[dict]:
    """
    Consulta múltiples feeds RSS de noticias cripto y filtra por el símbolo del activo.
    """
    symbol_upper = asset_symbol.upper()
    keywords = [symbol_upper]
    
    # Mapeo de términos relacionados
    if symbol_upper == 'BTC':
        keywords.extend(['BITCOIN', 'BTC'])
    elif symbol_upper == 'ETH':
        keywords.extend(['ETHEREUM', 'ETH', 'ETHER'])
    elif symbol_upper == 'SOL':
        keywords.extend(['SOLANA', 'SOL'])
    elif symbol_upper == 'ADA':
        keywords.extend(['CARDANO', 'ADA'])
    elif symbol_upper == 'XRP':
        keywords.extend(['RIPPLE', 'XRP'])

    urls = [
        ('https://cointelegraph.com/rss', 'CoinTelegraph'),
        ('https://www.coindesk.com/arc/outboundfeeds/rss/', 'CoinDesk'),
        ('https://cryptonews.com/news/feed/', 'CryptoNews'),
    ]
    
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    
    noticias = []
    for url, source_name in urls:
        try:
            resp = requests.get(url, headers=headers, verify=False, timeout=8)
            if resp.status_code != 200:
                continue
            
            # Limpiar contenido para evitar errores en XML mal formados
            root = ET.fromstring(resp.content)
            for item in root.findall('.//item'):
                title_elem = item.find('title')
                link_elem = item.find('link')
                pub_date_elem = item.find('pubDate')
                desc_elem = item.find('description')
                
                title = title_elem.text if title_elem is not None else ''
                link = link_elem.text if link_elem is not None else ''
                pub_date_str = pub_date_elem.text if pub_date_elem is not None else ''
                description = desc_elem.text if desc_elem is not None else ''
                
                # Filtrar noticias que contengan las palabras clave del activo
                search_text = f"{title} {description}".upper()
                if any(kw in search_text for kw in keywords):
                    try:
                        parsed_date = email.utils.parsedate_to_datetime(pub_date_str)
                    except Exception:
                        parsed_date = datetime.now()
                        
                    noticias.append({
                        'title': title,
                        'url': link,
                        'published_at': parsed_date,
                        'source': source_name,
                        'description': description[:300]
                    })
        except Exception as e:
            # Fallback silencioso por si falla alguna fuente
            print(f"Error parseando RSS de {source_name}: {e}")
            
    # Ordenar por fecha de publicación descendente y recortar al límite
    noticias.sort(key=lambda x: x['published_at'], reverse=True)
    return noticias[:limite]


def sincronizar_noticias(asset_symbol: str) -> int:
    """
    Sincroniza las noticias del feed RSS a la base de datos local
    y analiza el sentimiento básico de forma algorítmica.
    """
    nuevas = 0
    noticias_rss = obtener_noticias_rss(asset_symbol)
    
    for item in noticias_rss:
        url = item.get('url', '')
        if not url:
            continue
            
        # Evitar duplicados
        if NewsItem.objects.filter(url=url).exists():
            continue
            
        # Clasificador de sentimiento básico algorítmico
        title_lower = item.get('title', '').lower()
        desc_lower = item.get('description', '').lower()
        full_text = f"{title_lower} {desc_lower}"
        
        sentimiento = 'neutral'
        palabras_positivas = [
            'bull', 'surge', 'rise', 'growth', 'gain', 'high', 'up', 'positive', 'adopt', 'launch',
            'sube', 'alcista', 'crece', 'ganancia', 'máximo', 'maximo', 'aprobar', 'aprobó', 'soporte'
        ]
        palabras_negativas = [
            'bear', 'crash', 'drop', 'fall', 'loss', 'low', 'down', 'negative', 'hack', 'steal', 'scam',
            'baja', 'bajista', 'cae', 'pérdida', 'perdida', 'mínimo', 'minimo', 'pánico', 'panico', 'multa', 'demanda'
        ]
        
        if any(w in full_text for w in palabras_positivas):
            sentimiento = 'positive'
        if any(w in full_text for w in palabras_negativas):
            # Las negativas tienen prioridad en caso de ambigüedad
            sentimiento = 'negative'
            
        NewsItem.objects.create(
            asset_symbol=asset_symbol.upper(),
            titular=item.get('title', '')[:500],
            fuente=item.get('source', 'CryptoNews'),
            url=url,
            fecha_publicacion=item.get('published_at'),
            sentimiento=sentimiento,
        )
        nuevas += 1
        
    return nuevas
