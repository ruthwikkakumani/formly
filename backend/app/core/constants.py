QUESTION_TYPES = (
    "short_text",
    "long_text",
    "multiple_choice",
    "dropdown",
    "email",
    "number",
    "yes_no",
    "rating",
    "file_upload",
    "payment",
)

CHOICE_TYPES = {"multiple_choice", "dropdown", "yes_no", "rating"}
YES_NO_OPTIONS = ("Yes", "No")
RATING_VALUES = ("1", "2", "3", "4", "5")
MAX_UPLOAD_BYTES = 10 * 1024 * 1024
FONT_CHOICES = (
    "DM Sans",
    "Inter",
    "Plus Jakarta Sans",
    "Fraunces",
    "Playfair Display",
    "Lora",
)

THEME_DEFAULTS = {
    "color": "#191919",
    "background": "#f7f6f3",
    "accent": "#0445af",
    "font": "DM Sans",
    "thankYou": "Thanks for taking the time to complete this. Your response has been recorded.",
    "darkMode": False,
}
