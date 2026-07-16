"""Generate Nano Banana mockup images for the 4 seed products and persist them."""
import asyncio
import base64
import os
import sys
import uuid
from pathlib import Path
from dotenv import load_dotenv
from supabase import create_client, Client

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from storage import put_object, APP_NAME  # noqa: E402

from emergentintegrations.llm.chat import LlmChat, UserMessage  # noqa: E402

PROMPTS = {
    "regular-round-neck": (
        "Premium studio product photograph of a black 180 GSM bio-washed cotton round-neck plain "
        "blank t-shirt on a clean wooden hanger, soft front lighting, deep matte black background, "
        "subtle CMYK ink-splatter accents (cyan, magenta, yellow) floating around the tee, ultra "
        "realistic, sharp focus, 4k commercial e-commerce photography, no text, no logos."
    ),
    "oversized-tshirt": (
        "Premium studio product photograph of a lavender oversized drop-shoulder heavyweight 230 GSM "
        "blank t-shirt laid flat on dark concrete, slight 3D shadow, hint of cyan and magenta ink "
        "splash overlay on the edges, ultra realistic, streetwear lookbook, commercial e-commerce, "
        "no text, no logos."
    ),
    "premium-polo": (
        "Premium studio product photograph of a navy blue 220 GSM honeycomb pique polo t-shirt with "
        "white tipping on collar, neatly folded mannequin shot, professional corporate apparel "
        "photography, soft directional lighting, deep black background, subtle CMYK halftone "
        "background, ultra realistic, no text, no logos."
    ),
    "dry-fit-sports": (
        "Premium studio product photograph of a royal blue polyester dry-fit sports jersey t-shirt "
        "with subtle mesh texture, on a matte black backdrop, dynamic side angle, sport apparel "
        "photography, ultra crisp, magenta and yellow accent stripes of ink in background, ultra "
        "realistic 4k, no text, no logos."
    ),
}


async def main():
    api_key = os.environ["EMERGENT_LLM_KEY"]
    supabase_url = os.environ.get("SUPABASE_URL", "")
    supabase_key = os.environ.get("SUPABASE_KEY", "")
    supabase: Client = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None
    
    if not supabase:
        print("ERR: SUPABASE_URL or SUPABASE_KEY not found in .env")
        return

    for pid, prompt in PROMPTS.items():
        print(f"→ {pid}")
        chat = LlmChat(api_key=api_key, session_id=f"seed-{pid}", system_message="You are a product photographer.")
        chat.with_model("gemini", "gemini-3.1-flash-image-preview").with_params(modalities=["image", "text"])
        try:
            _, images = await chat.send_message_multimodal_response(UserMessage(text=prompt))
        except Exception as e:
            print(f"   ERR generating: {e}")
            continue
        if not images:
            print("   no image")
            continue
        img = images[0]
        data = base64.b64decode(img["data"])
        mime = img.get("mime_type") or "image/png"
        ext = "png" if mime == "image/png" else "jpg"
        fid = uuid.uuid4().hex
        path = f"{APP_NAME}/mockups/{pid}/{fid}.{ext}"
        result = put_object(path, data, mime)
        
        supabase.table("files").insert({
            "id": fid,
            "storage_path": result["path"],
            "original_filename": f"{pid}.{ext}",
            "content_type": mime,
            "size": result.get("size", len(data)),
            "folder": "mockups",
            "is_deleted": False,
        }).execute()
        
        supabase.table("products").update({"image": f"/api/files/{fid}"}).eq("id", pid).execute()
        print(f"   ✓ stored {fid} (size={len(data)})")

    print("Done.")


if __name__ == "__main__":
    asyncio.run(main())
