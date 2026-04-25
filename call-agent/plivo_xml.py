"""
PHML (Plivo XML) builders.
Plivo executes these instructions on the live call.
"""
from xml.etree.ElementTree import Element, SubElement, tostring

_XML_HEADER = '<?xml version="1.0" encoding="UTF-8"?>'


def _response() -> Element:
    return Element("Response")


def _speak(parent: Element, text: str) -> None:
    el = SubElement(parent, "Speak")
    el.set("voice", "WOMAN")
    el.set("language", "en-US")
    el.text = text


def _dump(el: Element) -> str:
    return _XML_HEADER + tostring(el, encoding="unicode")


def speak_and_record(text: str, record_action_url: str, max_length: int = 20) -> str:
    """Speak `text`, then record up to `max_length` seconds.
    Plivo POSTs the RecordUrl to `record_action_url` when done."""
    r = _response()
    _speak(r, text)
    rec = SubElement(r, "Record")
    rec.set("action", record_action_url)
    rec.set("maxLength", str(max_length))
    rec.set("finishOnKey", "#")
    rec.set("recordSession", "false")
    return _dump(r)


def speak_and_hangup(text: str) -> str:
    """Speak `text` then end the call."""
    r = _response()
    _speak(r, text)
    SubElement(r, "Hangup")
    return _dump(r)


def silence_and_hangup() -> str:
    r = _response()
    SubElement(r, "Hangup")
    return _dump(r)
