import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Unauthorized = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const goBack = () => navigate(-1);

  return (
    <section>
      <h1>{t("common.unauthorized")}</h1>
      <br />
      <p>{t("common.unauthorizedMessage")}</p>
      <div className="flexGrow">
        <button onClick={goBack}>{t("common.goBack")}</button>
      </div>
    </section>
  );
};

export default Unauthorized;
