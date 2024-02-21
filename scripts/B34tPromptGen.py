import contextlib

import gradio as gr
from modules import scripts, shared, script_callbacks
from modules.ui_components import FormRow, FormColumn, FormGroup, ToolButton
import json
import os
import random
stylespath = ""

def get_text_content(file_path):
    try:
        with open(file_path, 'rt', encoding="utf-8") as file:
            text_data = file.read()
            return text_data
    except Exception as e:
        print(f"A Problem occurred: {str(e)}")

class B34tPromptGen(scripts.Script):
    def __init__(self) -> None:
        super().__init__()

    styleNames = []

    def title(self):
        return "b34t prompt generator"

    def show(self, is_img2img):
        return scripts.AlwaysVisible

    def ui(self, is_img2img):

        if is_img2img:
            return []

        enabled = getattr(shared.opts, "enable_b34tpromptgen_by_default", True)
        html_template_path = os.path.join( os.path.dirname(os.path.realpath(__file__)), 'html_template.html' )
        html_template_txt = get_text_content( html_template_path )
        with gr.Group():
            with gr.Accordion("B34t Prompt Generator", open=enabled):
                global_container = gr.HTML(html_template_txt)

        return [ global_container ]

    def after_component(self, component, **kwargs):
        # https://github.com/AUTOMATIC1111/stable-diffusion-webui/pull/7456#issuecomment-1414465888 helpfull link
        # Find the text2img textbox component
        if kwargs.get("elem_id") == "txt2img_prompt":  # postive prompt textbox
            self.boxx = component

def on_ui_settings():
    section = ("b34tpromptgen", "B34t Prompt Gen")

    shared.opts.add_option(
        "enable_b34tpromptgen_by_default",
        shared.OptionInfo(
            True,
            "enable B34t Prompt Generator by default",
            gr.Checkbox,
            section=section
            )
    )
script_callbacks.on_ui_settings(on_ui_settings)
