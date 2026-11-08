"use client";

import { useActionState, useState } from "react";
import {
  submitEducationalAssistanceApplication,
  submitJobseekerApplication,
  type ApplicationFormState,
} from "@/app/actions/applications";
import {
  civilStatusOptions,
  educationalAttainmentOptions,
  registeredVoterOptions,
  religionOptions,
  workStatusOptions,
  youthAgeGroupOptions,
  youthClassificationOptions,
} from "@/lib/education-application-options";

const initialState: ApplicationFormState = {};
const acceptedDocumentTypes = ".jpg,.jpeg,.png,.webp,.pdf";

function DocumentUpload({
  name,
  title,
}: {
  name: string;
  title: string;
}) {
  return (
    <div className="application-document-field">
      <label className="application-document-title" htmlFor={name}>
        {title}
      </label>
      <input
        accept={acceptedDocumentTypes}
        id={name}
        name={name}
        required
        type="file"
      />
      <small>Upload this document. Maximum file size: 5 MB.</small>
    </div>
  );
}

export default function ResidentApplicationForms({
  educationApplicationsOpen,
  educationApplicationsSettingsError,
}: {
  educationApplicationsOpen: boolean;
  educationApplicationsSettingsError?: string;
}) {
  const [educationLevel, setEducationLevel] = useState("");
  const [yearOrGradeLevel, setYearOrGradeLevel] = useState("");
  const [religion, setReligion] = useState("");
  const [educationalAttainment, setEducationalAttainment] = useState("");
  const isGraduate =
    educationalAttainment === "College Graduate" ||
    educationalAttainment === "Doctorate Graduate";
  const [educationState, educationAction, educationPending] = useActionState(
    submitEducationalAssistanceApplication,
    initialState,
  );
  const [jobseekerState, jobseekerAction, jobseekerPending] = useActionState(
    submitJobseekerApplication,
    initialState,
  );

  return (
    <section className="resident-apply-section" aria-labelledby="apply-heading">
      <div className="dashboard-section-title">
        <div>
          <span className="section-kicker">ONLINE APPLICATIONS</span>
          <h2 id="apply-heading">Apply for assistance</h2>
        </div>
      </div>
      <div className="resident-application-forms">
        <details className="resident-application-form-card">
          <summary>
            <span>
              <strong>Educational assistance</strong>
              <small>
                {educationApplicationsSettingsError
                  ? "Application availability is temporarily unavailable"
                  : educationApplicationsOpen
                    ? "Apply as a high school or college student"
                    : "Applications are currently closed"}
              </small>
            </span>
            <span className="application-form-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          {educationApplicationsSettingsError ? (
            <p className="education-application-closed" role="alert">
              Application availability could not be verified. Please try again
              later or contact the barangay office.
            </p>
          ) : !educationApplicationsOpen ? (
            <p className="education-application-closed" role="status">
              Educational assistance applications are currently closed.
            </p>
          ) : (
            <form
              action={educationAction}
              className="resident-application-form"
            >
              <label>
                Full name
                <input
                  autoComplete="name"
                  maxLength={150}
                  name="applicant_name"
                  required
                />
              </label>
              <label>
                Contact number <span>(optional)</span>
                <input
                  autoComplete="tel"
                  maxLength={40}
                  name="contact_number"
                  pattern="\+63[ ()-]?[2-9][0-9 ()-]{7,12}[0-9]"
                  placeholder="+63 917 123 4567"
                  title="Use +63 followed by a valid Philippine phone number."
                  type="tel"
                />
                <small>Enter a Philippine number starting with +63.</small>
              </label>
              <label>
                Zone
                <select name="zone" required>
                  <option disabled value="">
                    Select your zone
                  </option>
                  {Array.from({ length: 7 }, (_, index) => index + 1).map(
                    (zone) => (
                      <option key={zone} value={`Zone ${zone}`}>
                        Zone {zone}
                      </option>
                    ),
                  )}
                </select>
              </label>
              <label>
                Religion
                <select
                  name="religion"
                  required
                  value={religion}
                  onChange={(event) => setReligion(event.target.value)}
                >
                  <option disabled value="">
                    Select your religion
                  </option>
                  {religionOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {religion === "Other" && (
                <label>
                  Specify your religion
                  <input
                    autoComplete="off"
                    maxLength={100}
                    name="religion_other"
                    required
                  />
                </label>
              )}
              <label>
                Civil status
                <select name="civil_status" required>
                  <option disabled value="">
                    Select your civil status
                  </option>
                  {civilStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Youth age group
                <select name="youth_age_group" required>
                  <option disabled value="">
                    Select your age group
                  </option>
                  {youthAgeGroupOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Youth classification
                <select name="youth_classification" required>
                  <option disabled value="">
                    Select your youth classification
                  </option>
                  {youthClassificationOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Work status
                <select name="work_status" required>
                  <option disabled value="">
                    Select your work status
                  </option>
                  {workStatusOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Educational attainment
                <select
                  name="educational_attainment"
                  required
                  value={educationalAttainment}
                  onChange={(event) => {
                    const attainment = event.target.value;
                    setEducationalAttainment(attainment);
                    if (
                      attainment === "Highschool Graduate" ||
                      attainment === "College Graduate" ||
                      attainment === "Doctorate Graduate"
                    ) {
                      setEducationLevel("");
                      setYearOrGradeLevel("");
                    }
                  }}
                >
                  <option disabled value="">
                    Select your educational attainment
                  </option>
                  {educationalAttainmentOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Registered voter
                <select name="registered_voter" required>
                  <option disabled value="">
                    Select an option
                  </option>
                  {registeredVoterOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              {!isGraduate && (
                <label>
                  Education level
                  <select
                    name="education_level"
                    required
                    value={educationLevel}
                    onChange={(event) => {
                      setEducationLevel(event.target.value);
                      setYearOrGradeLevel("");
                    }}
                  >
                    <option disabled value="">
                      Select your level
                    </option>
                    {educationalAttainment !== "Highschool Graduate" && (
                      <option value="high_school">High school</option>
                    )}
                    <option value="college">College</option>
                  </select>
                </label>
              )}
              <label>
                School name
                <input maxLength={200} name="school_name" required />
              </label>
              {!isGraduate && (
                <label>
                  Year or grade level
                  <select
                    disabled={!educationLevel}
                    name="year_or_grade_level"
                    required
                    value={yearOrGradeLevel}
                    onChange={(event) =>
                      setYearOrGradeLevel(event.target.value)
                    }
                  >
                    <option disabled value="">
                      {educationLevel
                        ? "Select your year or grade"
                        : "Select your education level first"}
                    </option>
                    {educationLevel === "high_school" &&
                      Array.from({ length: 6 }, (_, index) => index + 7).map(
                        (grade) => (
                          <option key={grade} value={`Grade ${grade}`}>
                            Grade {grade}
                          </option>
                        ),
                      )}
                    {educationLevel === "college" &&
                      ["First", "Second", "Third", "Fourth", "Fifth"].map(
                        (year) => (
                          <option key={year} value={`${year} year`}>
                            {year} year
                          </option>
                        ),
                      )}
                  </select>
                </label>
              )}
              <div className="application-document-group">
                <span className="application-document-heading">
                  Required documents
                </span>
                <DocumentUpload
                  name="school_assessment"
                  title="School assessment"
                />
                <DocumentUpload
                  name="school_id_front"
                  title="School ID · front"
                />
                <DocumentUpload
                  name="school_id_back"
                  title="School ID · back"
                />
              </div>
              {educationState.error && (
                <p className="application-form-message error" role="alert">
                  {educationState.error}
                </p>
              )}
              {educationState.success && (
                <p className="application-form-message success" role="status">
                  {educationState.success}
                </p>
              )}
              <button disabled={educationPending} type="submit">
                {educationPending ? "Submitting..." : "Submit application"}
              </button>
            </form>
          )}
        </details>

        <details className="resident-application-form-card">
          <summary>
            <span>
              <strong>Jobseeker assistance</strong>
              <small>Share your contact and employment interests</small>
            </span>
            <span className="application-form-toggle" aria-hidden="true">
              +
            </span>
          </summary>
          <form
            action={jobseekerAction}
            className="resident-application-form"
          >
            <label>
              Full name
              <input
                autoComplete="name"
                maxLength={150}
                name="applicant_name"
                required
              />
            </label>
            <div className="application-document-group">
              <span className="application-document-heading">
                Required documents
              </span>
              <DocumentUpload
                name="valid_id_front"
                title="Valid ID · front"
              />
              <DocumentUpload
                name="valid_id_back"
                title="Valid ID · back"
              />
            </div>
            <label>
              Contact number <span>(optional)</span>
              <input
                autoComplete="tel"
                maxLength={40}
                name="contact_number"
                pattern="\+63[ ()-]?[2-9][0-9 ()-]{7,12}[0-9]"
                placeholder="+63 917 123 4567"
                title="Use +63 followed by a valid Philippine phone number."
                type="tel"
              />
              <small>Enter a Philippine number starting with +63.</small>
            </label>
            <label>
              Preferred position or type of work
              <input maxLength={150} name="desired_position" required />
            </label>
            <label>
              Skills or experience <span>(optional)</span>
              <textarea
                maxLength={2000}
                name="skills_experience"
                rows={3}
              />
            </label>
            {jobseekerState.error && (
              <p className="application-form-message error" role="alert">
                {jobseekerState.error}
              </p>
            )}
            {jobseekerState.success && (
              <p className="application-form-message success" role="status">
                {jobseekerState.success}
              </p>
            )}
            <button disabled={jobseekerPending} type="submit">
              {jobseekerPending ? "Submitting..." : "Submit application"}
            </button>
          </form>
        </details>
      </div>
      <p className="resident-application-privacy">
        Your email address is taken from your signed-in account. Application
        details are only visible to you and authorized barangay administrators.
      </p>
    </section>
  );
}
