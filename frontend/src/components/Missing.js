import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

const Missing = () => {
  const { t } = useTranslation();

  return (
    <article style={{ padding: "100px" }}>
      <h1>{t("common.pageNotFoundTitle")}</h1>
      <p>{t("common.pageNotFound")}</p>
      <div className="flexGrow">
        <Link to="/">{t("common.visitHomepage")}</Link>
      </div>
    </article>
  );
};

export default Missing;
