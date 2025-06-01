from extraction import FormExtraction

form_extractor = FormExtraction()

results = form_extractor.extract_form_fields("fw4.pdf")

print(results)