import { useTranslation } from "react-i18next";
const UseCases = () => {
  const {
    t
  } = useTranslation('landing');
  const useCases = [{
    id: 'socialMedia',
    color: 'primary',
    featureCount: 3
  }, {
    id: 'customerService',
    color: 'secondary',
    featureCount: 3
  }, {
    id: 'sales',
    color: 'accent',
    featureCount: 3
  }, {
    id: 'ecommerce',
    color: 'primary',
    featureCount: 3
  }, {
    id: 'professionalServices',
    color: 'secondary',
    featureCount: 3
  }, {
    id: 'education',
    color: 'accent',
    featureCount: 3
  }];
  return <section id="casos-de-uso" className="py-16 scroll-mt-24">
      
    </section>;
};
export default UseCases;