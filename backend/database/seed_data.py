"""
database/seed_data.py
12 Hospitals + 40 Doctors
- 6 hospitals are full-service (all specialties)
- 6 hospitals are specialty-focused
- Dates: real YYYY-MM-DD computed at seed time (IST)
- Time slots in IST format
"""
import json, sys
from datetime import date, timedelta
from sqlalchemy.orm import Session
from database.database import SessionLocal, engine, Base
from database.models import Hospital, Doctor

def _dates(n, skip_sun=True):
    out, d = [], date.today()
    while len(out) < n:
        if not (skip_sun and d.weekday() == 6):
            out.append(d.strftime("%Y-%m-%d"))
        d += timedelta(days=1)
    return out

def seed_hospitals_and_doctors(db=None, force_reseed=False):
    Base.metadata.create_all(bind=engine)
    close = not db
    if not db: db = SessionLocal()

    D10=_dates(10); D8=D10[:8]; D6=D10[:6]; D5=D10[:5]; D4=D10[:4]; D3=D10[:3]

    HOSPITALS = [
        # ── 6 Full-service (all specialty) hospitals ────────────────────────
        {"id":"hosp-apollo","name":"Apollo Hospitals","location":"Jubilee Hills, Road No. 72","city":"Hyderabad","rating":4.8,"reviews_count":4250,"accreditation":"JCI & NABH Accredited","phone":"040-23607777","image":"https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=400&q=80","departments":json.dumps(["General Physician","Cardiologist","Neurologist","Gastroenterologist","Endocrinologist","Orthopedist","Pulmonologist","Dermatologist","Gynecologist","Nephrologist","Oncologist","Urologist","ENT Specialist","Pediatrician","Psychiatrist"])},
        {"id":"hosp-care","name":"CARE Hospitals","location":"Banjara Hills, Road No. 1","city":"Hyderabad","rating":4.7,"reviews_count":2980,"accreditation":"NABH & ISO 9001","phone":"040-30418888","image":"https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=400&q=80","departments":json.dumps(["General Physician","Cardiologist","Neurologist","Gastroenterologist","Orthopedist","Pulmonologist","Dermatologist","Gynecologist","Nephrologist","Oncologist","Urologist","ENT Specialist","Pediatrician","Psychiatrist"])},
        {"id":"hosp-yashoda","name":"Yashoda Hospitals","location":"Secunderabad, SP Road","city":"Hyderabad","rating":4.6,"reviews_count":3500,"accreditation":"NABH Accredited","phone":"040-45674567","image":"https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&q=80","departments":json.dumps(["General Physician","Cardiologist","Neurologist","Orthopedist","Dermatologist","Gynecologist","Pulmonologist","ENT Specialist","Psychiatrist","Pediatrician"])},
        {"id":"hosp-kims","name":"KIMS Hospitals","location":"Kondapur, Hi-Tech City","city":"Hyderabad","rating":4.7,"reviews_count":2100,"accreditation":"NABH & NABL","phone":"040-44885000","image":"https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=400&q=80","departments":json.dumps(["General Physician","Cardiologist","Neurologist","Endocrinologist","Nephrologist","Gastroenterologist","Pulmonologist","Orthopedist","Dermatologist","Gynecologist"])},
        {"id":"hosp-continental","name":"Continental Hospitals","location":"Nanakramguda, Financial District","city":"Hyderabad","rating":4.8,"reviews_count":3200,"accreditation":"JCI & NABH","phone":"040-67000000","image":"https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&q=80","departments":json.dumps(["General Physician","Cardiologist","Oncologist","Neurologist","Urologist","Gynecologist","Orthopedist","Dermatologist","Psychiatrist","Pediatrician"])},
        {"id":"hosp-omni","name":"Omni Hospitals","location":"Kothapet, Dilsukhnagar","city":"Hyderabad","rating":4.5,"reviews_count":1800,"accreditation":"NABH Accredited","phone":"040-66103333","image":"https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&q=80","departments":json.dumps(["General Physician","Cardiologist","Neurologist","Orthopedist","Gynecologist","Pediatrician","Pulmonologist","Dermatologist","ENT Specialist"])},
        # ── 6 Specialty-focused hospitals ────────────────────────────────────
        {"id":"hosp-aig","name":"AIG Hospitals","location":"Gachibowli, Mind Space","city":"Hyderabad","rating":4.9,"reviews_count":5100,"accreditation":"JCI & NABH","phone":"040-42444222","image":"https://images.unsplash.com/photo-1587351021355-a479a299d2f9?w=400&q=80","departments":json.dumps(["Gastroenterologist","Hepatology","Surgical Gastroenterology","Bariatrics"])},
        {"id":"hosp-star","name":"Star Hospitals","location":"Banjara Hills, Road No. 10","city":"Hyderabad","rating":4.7,"reviews_count":2600,"accreditation":"NABH & JCI","phone":"040-44855000","image":"https://images.unsplash.com/photo-1516841273335-e39b37888115?w=400&q=80","departments":json.dumps(["Pulmonologist","Respiratory Medicine","Critical Care","Allergy & Immunology"])},
        {"id":"hosp-maxcure","name":"Maxcure Hospitals","location":"Madhapur, Hi-Tech City","city":"Hyderabad","rating":4.6,"reviews_count":1500,"accreditation":"NABH","phone":"040-71222222","image":"https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80","departments":json.dumps(["Orthopedist","Spine Surgery","Sports Medicine","Physiotherapy","Pain Management"])},
        {"id":"hosp-medicover","name":"Medicover Hospitals","location":"Hitec City, Madhapur","city":"Hyderabad","rating":4.5,"reviews_count":1900,"accreditation":"NABH","phone":"040-68888888","image":"https://images.unsplash.com/photo-1504813184591-01572f98c85f?w=400&q=80","departments":json.dumps(["Dermatologist","Cosmetology","Hair Transplant","Laser Surgery"])},
        {"id":"hosp-rainbow","name":"Rainbow Childrens Hospital","location":"Banjara Hills, Road No. 14","city":"Hyderabad","rating":4.9,"reviews_count":4800,"accreditation":"NABH & JCI","phone":"040-44888000","image":"https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80","departments":json.dumps(["Pediatrician","Neonatology","Pediatric Surgery","Pediatric Cardiology","Child Development"])},
        {"id":"hosp-fernandez","name":"Fernandez Hospital","location":"Bogulkunta, Abids","city":"Hyderabad","rating":4.8,"reviews_count":3100,"accreditation":"JCI & NABH","phone":"040-40271000","image":"https://images.unsplash.com/photo-1519494080410-f9aa76cb4283?w=400&q=80","departments":json.dumps(["Gynecologist","Obstetrics","Infertility","Laparoscopy","High-Risk Pregnancy"])},
    ]

    DOCTORS = [
        # General Physician — spread across full-service hospitals
        {"id":"doc-venkatesh","name":"Dr. Venkatesh Prasad","specialization":"General Physician","sub_specialty":"Internal Medicine & Preventive Health","hospital_id":"hosp-apollo","experience":"8+ yrs","rating":4.8,"reviews_count":840,"fee":"800","avatar":"https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&q=80","available_dates":json.dumps(D8),"slots":json.dumps(["09:30 AM","11:00 AM","12:30 PM","03:00 PM","05:00 PM","07:00 PM"])},
        {"id":"doc-krishna","name":"Dr. Krishna Mohan","specialization":"General Physician","sub_specialty":"Family Medicine & Chronic Disease","hospital_id":"hosp-omni","experience":"12+ yrs","rating":4.6,"reviews_count":620,"fee":"600","avatar":"https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:00 AM","10:30 AM","02:00 PM","04:30 PM","06:30 PM"])},
        {"id":"doc-meena","name":"Dr. Meena Swaminathan","specialization":"General Physician","sub_specialty":"Geriatric & Internal Medicine","hospital_id":"hosp-kims","experience":"10+ yrs","rating":4.7,"reviews_count":510,"fee":"750","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","11:30 AM","04:00 PM","06:00 PM"])},
        {"id":"doc-ravi-gp","name":"Dr. Ravi Kumar","specialization":"General Physician","sub_specialty":"Lifestyle & Wellness Medicine","hospital_id":"hosp-care","experience":"6+ yrs","rating":4.5,"reviews_count":380,"fee":"550","avatar":"https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:00 AM","11:00 AM","01:00 PM","03:30 PM","05:30 PM"])},
        # Cardiologist
        {"id":"doc-reddy","name":"Dr. Srinivas Reddy","specialization":"Cardiologist","sub_specialty":"Interventional Cardiology & Heart Failure","hospital_id":"hosp-care","experience":"15+ yrs","rating":4.9,"reviews_count":1820,"fee":"1500","avatar":"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:00 AM","10:30 AM","12:00 PM","03:00 PM","05:30 PM"])},
        {"id":"doc-rajan","name":"Dr. Arjun Rajan","specialization":"Cardiologist","sub_specialty":"Electrophysiology & Arrhythmia","hospital_id":"hosp-apollo","experience":"20+ yrs","rating":4.9,"reviews_count":2100,"fee":"2000","avatar":"https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","01:00 PM","04:00 PM"])},
        {"id":"doc-lakshmi-cardio","name":"Dr. Lakshmi Devi","specialization":"Cardiologist","sub_specialty":"Preventive Cardiology & Echo","hospital_id":"hosp-yashoda","experience":"11+ yrs","rating":4.7,"reviews_count":980,"fee":"1200","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:30 AM","11:30 AM","03:30 PM","05:00 PM"])},
        {"id":"doc-sunil-cardio","name":"Dr. Sunil Mathur","specialization":"Cardiologist","sub_specialty":"Cardiac Imaging & Valve Disease","hospital_id":"hosp-continental","experience":"13+ yrs","rating":4.8,"reviews_count":1100,"fee":"1600","avatar":"https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:00 PM","04:30 PM"])},
        # Neurologist
        {"id":"doc-anita","name":"Dr. Anita Sharma","specialization":"Neurologist","sub_specialty":"Stroke & Headache Disorders","hospital_id":"hosp-yashoda","experience":"12+ yrs","rating":4.7,"reviews_count":760,"fee":"1200","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["10:30 AM","12:00 PM","03:30 PM","05:30 PM"])},
        {"id":"doc-ramesh-neuro","name":"Dr. Ramesh Babu","specialization":"Neurologist","sub_specialty":"Movement Disorders & Epilepsy","hospital_id":"hosp-kims","experience":"17+ yrs","rating":4.8,"reviews_count":1200,"fee":"1500","avatar":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:00 AM","11:00 AM","02:00 PM","04:30 PM"])},
        {"id":"doc-surya-neuro","name":"Dr. Surya Prakash","specialization":"Neurologist","sub_specialty":"Neuro-Critical Care & Dementia","hospital_id":"hosp-care","experience":"14+ yrs","rating":4.6,"reviews_count":890,"fee":"1300","avatar":"https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:30 PM","04:00 PM"])},
        # Gastroenterologist
        {"id":"doc-rao","name":"Dr. D. Nageshwar Rao","specialization":"Gastroenterologist","sub_specialty":"Advanced Endoscopy & ERCP","hospital_id":"hosp-aig","experience":"25+ yrs","rating":4.9,"reviews_count":4800,"fee":"2000","avatar":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["11:00 AM","01:30 PM","04:30 PM"])},
        {"id":"doc-pradeep-gastro","name":"Dr. Pradeep Kumar","specialization":"Gastroenterologist","sub_specialty":"Liver Disease & Hepatology","hospital_id":"hosp-apollo","experience":"13+ yrs","rating":4.7,"reviews_count":1100,"fee":"1500","avatar":"https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:30 AM","11:00 AM","03:00 PM","05:00 PM"])},
        {"id":"doc-mamatha-gastro","name":"Dr. Mamatha Reddy","specialization":"Gastroenterologist","sub_specialty":"IBD & Functional GI Disorders","hospital_id":"hosp-care","experience":"9+ yrs","rating":4.6,"reviews_count":720,"fee":"1200","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:00 PM","03:30 PM"])},
        # Endocrinologist
        {"id":"doc-sneha","name":"Dr. Sneha Desai","specialization":"Endocrinologist","sub_specialty":"Diabetes & Thyroid Disorders","hospital_id":"hosp-kims","experience":"10+ yrs","rating":4.8,"reviews_count":850,"fee":"1100","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:30 AM","11:00 AM","01:00 PM","04:00 PM"])},
        {"id":"doc-harish-endo","name":"Dr. Harish Rao","specialization":"Endocrinologist","sub_specialty":"Obesity & Metabolic Syndrome","hospital_id":"hosp-apollo","experience":"14+ yrs","rating":4.7,"reviews_count":960,"fee":"1300","avatar":"https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:00 AM","10:30 AM","02:30 PM","05:00 PM"])},
        # Orthopedist
        {"id":"doc-kapoor","name":"Dr. Anil Kapoor","specialization":"Orthopedist","sub_specialty":"Joint Replacement & Spine Surgery","hospital_id":"hosp-apollo","experience":"18+ yrs","rating":4.7,"reviews_count":1490,"fee":"1500","avatar":"https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["10:00 AM","12:00 PM","03:00 PM","06:00 PM"])},
        {"id":"doc-suresh-ortho","name":"Dr. Suresh Yadav","specialization":"Orthopedist","sub_specialty":"Sports Medicine & Arthroscopy","hospital_id":"hosp-maxcure","experience":"11+ yrs","rating":4.6,"reviews_count":780,"fee":"1200","avatar":"https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:30 AM","11:30 AM","02:00 PM","04:30 PM"])},
        {"id":"doc-kavitha-ortho","name":"Dr. Kavitha Nair","specialization":"Orthopedist","sub_specialty":"Pediatric Orthopedics & Scoliosis","hospital_id":"hosp-yashoda","experience":"8+ yrs","rating":4.5,"reviews_count":540,"fee":"1000","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["10:00 AM","01:30 PM","04:00 PM"])},
        # Pulmonologist
        {"id":"doc-singh","name":"Dr. Vikram Singh","specialization":"Pulmonologist","sub_specialty":"Asthma, COPD & Sleep Disorders","hospital_id":"hosp-care","experience":"14+ yrs","rating":4.6,"reviews_count":930,"fee":"1200","avatar":"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["10:00 AM","12:00 PM","03:00 PM","05:30 PM"])},
        {"id":"doc-naveen-pulmo","name":"Dr. Naveen Kumar","specialization":"Pulmonologist","sub_specialty":"Critical Care & Bronchoscopy","hospital_id":"hosp-star","experience":"12+ yrs","rating":4.8,"reviews_count":1050,"fee":"1400","avatar":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:00 AM","11:00 AM","02:30 PM","04:00 PM"])},
        {"id":"doc-sowmya-pulmo","name":"Dr. Sowmya Reddy","specialization":"Pulmonologist","sub_specialty":"ILD & Pulmonary Hypertension","hospital_id":"hosp-yashoda","experience":"9+ yrs","rating":4.7,"reviews_count":670,"fee":"1100","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["10:30 AM","01:00 PM","03:30 PM"])},
        # Dermatologist
        {"id":"doc-mehta","name":"Dr. Priya Mehta","specialization":"Dermatologist","sub_specialty":"Cosmetology & Skin Cancer","hospital_id":"hosp-yashoda","experience":"9+ yrs","rating":4.8,"reviews_count":1220,"fee":"900","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["11:00 AM","01:00 PM","03:00 PM","05:30 PM"])},
        {"id":"doc-aditya-derm","name":"Dr. Aditya Rao","specialization":"Dermatologist","sub_specialty":"Hair Disorders & Trichology","hospital_id":"hosp-medicover","experience":"7+ yrs","rating":4.6,"reviews_count":780,"fee":"900","avatar":"https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:00 PM","02:30 PM","05:00 PM"])},
        {"id":"doc-rashmi-derm","name":"Dr. Rashmi Joshi","specialization":"Dermatologist","sub_specialty":"Allergy & Immunodermatology","hospital_id":"hosp-continental","experience":"11+ yrs","rating":4.7,"reviews_count":920,"fee":"1000","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:30 AM","11:30 AM","03:00 PM","04:30 PM"])},
        # Gynecologist
        {"id":"doc-sunitha-gynae","name":"Dr. Sunitha Fernandez","specialization":"Gynecologist","sub_specialty":"High-Risk Pregnancy & IVF","hospital_id":"hosp-fernandez","experience":"18+ yrs","rating":4.9,"reviews_count":3200,"fee":"1800","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:00 PM","03:00 PM","05:00 PM"])},
        {"id":"doc-padma-gynae","name":"Dr. Padma Srinivas","specialization":"Gynecologist","sub_specialty":"Laparoscopy & Endometriosis","hospital_id":"hosp-apollo","experience":"12+ yrs","rating":4.7,"reviews_count":1450,"fee":"1500","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["09:30 AM","11:00 AM","02:00 PM","04:30 PM"])},
        {"id":"doc-yamuna-gynae","name":"Dr. Yamuna Krishnan","specialization":"Gynecologist","sub_specialty":"PCOS & Infertility Management","hospital_id":"hosp-yashoda","experience":"10+ yrs","rating":4.6,"reviews_count":980,"fee":"1300","avatar":"https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:30 AM","01:00 PM","03:30 PM","05:00 PM"])},
        # Nephrologist
        {"id":"doc-raja-nephro","name":"Dr. Raja Sekhar","specialization":"Nephrologist","sub_specialty":"Dialysis & Kidney Transplant","hospital_id":"hosp-kims","experience":"16+ yrs","rating":4.8,"reviews_count":1100,"fee":"1600","avatar":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:00 PM","03:00 PM"])},
        {"id":"doc-madhuri-nephro","name":"Dr. Madhuri Kanth","specialization":"Nephrologist","sub_specialty":"CKD & Glomerulonephritis","hospital_id":"hosp-apollo","experience":"11+ yrs","rating":4.7,"reviews_count":780,"fee":"1400","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:30 AM","11:30 AM","02:30 PM","05:00 PM"])},
        # Oncologist
        {"id":"doc-rahul-onco","name":"Dr. Rahul Chandra","specialization":"Oncologist","sub_specialty":"Medical Oncology & Chemotherapy","hospital_id":"hosp-continental","experience":"17+ yrs","rating":4.8,"reviews_count":1650,"fee":"2000","avatar":"https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["10:00 AM","01:00 PM","04:00 PM"])},
        {"id":"doc-neelaveni-onco","name":"Dr. Neelaveni Reddy","specialization":"Oncologist","sub_specialty":"Breast Cancer & Surgical Oncology","hospital_id":"hosp-apollo","experience":"14+ yrs","rating":4.9,"reviews_count":2100,"fee":"2500","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["11:00 AM","02:00 PM","05:00 PM"])},
        # Urologist
        {"id":"doc-bhaskar-uro","name":"Dr. Bhaskar Rao","specialization":"Urologist","sub_specialty":"Robotic Surgery & Kidney Stones","hospital_id":"hosp-care","experience":"15+ yrs","rating":4.7,"reviews_count":1100,"fee":"1600","avatar":"https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:00 AM","11:30 AM","02:30 PM","05:00 PM"])},
        {"id":"doc-kishore-uro","name":"Dr. Kishore Babu","specialization":"Urologist","sub_specialty":"Prostate & Bladder Cancer","hospital_id":"hosp-continental","experience":"12+ yrs","rating":4.6,"reviews_count":870,"fee":"1800","avatar":"https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["10:30 AM","01:30 PM","04:30 PM"])},
        # ENT Specialist
        {"id":"doc-prasad-ent","name":"Dr. Prasad Naidu","specialization":"ENT Specialist","sub_specialty":"Cochlear Implant & Sinus Surgery","hospital_id":"hosp-care","experience":"13+ yrs","rating":4.7,"reviews_count":890,"fee":"1000","avatar":"https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["09:30 AM","11:00 AM","02:00 PM","04:30 PM"])},
        {"id":"doc-sreedevi-ent","name":"Dr. Sreedevi Kaur","specialization":"ENT Specialist","sub_specialty":"Allergy & Voice Disorders","hospital_id":"hosp-omni","experience":"9+ yrs","rating":4.5,"reviews_count":610,"fee":"900","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["10:00 AM","12:30 PM","03:00 PM"])},
        # Pediatrician
        {"id":"doc-jaya-peds","name":"Dr. Jaya Kamath","specialization":"Pediatrician","sub_specialty":"Neonatology & Child Development","hospital_id":"hosp-rainbow","experience":"14+ yrs","rating":4.9,"reviews_count":3100,"fee":"1200","avatar":"https://images.unsplash.com/photo-1594824432258-297eb61b47ee?w=150&q=80","available_dates":json.dumps(D8),"slots":json.dumps(["09:00 AM","10:30 AM","12:00 PM","03:00 PM","05:30 PM"])},
        {"id":"doc-ram-peds","name":"Dr. Ram Mohan","specialization":"Pediatrician","sub_specialty":"Pediatric Cardiology","hospital_id":"hosp-apollo","experience":"16+ yrs","rating":4.8,"reviews_count":2300,"fee":"1500","avatar":"https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&q=80","available_dates":json.dumps(D6),"slots":json.dumps(["10:00 AM","11:30 AM","02:30 PM","04:30 PM"])},
        # Psychiatrist
        {"id":"doc-rekha-psych","name":"Dr. Rekha Pillai","specialization":"Psychiatrist","sub_specialty":"Anxiety, Depression & OCD","hospital_id":"hosp-apollo","experience":"10+ yrs","rating":4.8,"reviews_count":980,"fee":"1200","avatar":"https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=150&q=80","available_dates":json.dumps(D5),"slots":json.dumps(["10:00 AM","12:00 PM","03:00 PM","05:00 PM"])},
        {"id":"doc-ganesh-psych","name":"Dr. Ganesh Kumar","specialization":"Psychiatrist","sub_specialty":"Addiction & Schizophrenia","hospital_id":"hosp-continental","experience":"12+ yrs","rating":4.6,"reviews_count":710,"fee":"1100","avatar":"https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=150&q=80","available_dates":json.dumps(D4),"slots":json.dumps(["11:00 AM","01:30 PM","04:00 PM"])},
    ]

    try:
        eh = db.query(Hospital).count(); ed = db.query(Doctor).count()
        if force_reseed or eh == 0:
            if force_reseed and eh > 0:
                print("Clearing old data..."); db.query(Doctor).delete(); db.query(Hospital).delete(); db.commit()
            print(f"Seeding {len(HOSPITALS)} hospitals...")
            for h in HOSPITALS: db.add(Hospital(**h))
            db.commit(); print(f"OK {len(HOSPITALS)} hospitals seeded.")
        else: print(f"Hospitals already exist ({eh}). Skip.")
        if force_reseed or ed == 0:
            print(f"Seeding {len(DOCTORS)} doctors...")
            for d in DOCTORS: db.add(Doctor(**d))
            db.commit(); print(f"OK {len(DOCTORS)} doctors seeded.")
        else: print(f"Doctors already exist ({ed}). Skip.")
    except Exception as e:
        db.rollback(); print(f"Error: {e}"); raise
    finally:
        if close: db.close()

seed_database = seed_hospitals_and_doctors
if __name__ == "__main__":
    seed_hospitals_and_doctors(force_reseed="--force" in sys.argv)
    print("Done.")

