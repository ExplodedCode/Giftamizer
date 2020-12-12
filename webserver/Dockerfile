FROM nginx:alpine

WORKDIR /usr/share/nginx/html/


COPY . ./

# COPY --from=build /build /usr/share/nginx/html

RUN rm /etc/nginx/conf.d/default.conf
RUN cp /usr/share/nginx/html/nginx.conf /etc/nginx/conf.d/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
